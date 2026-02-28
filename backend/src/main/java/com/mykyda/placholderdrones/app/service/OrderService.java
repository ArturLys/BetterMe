package com.mykyda.placholderdrones.app.service;

import com.mykyda.placholderdrones.app.DTO.create.OrderCreateDTO;
import com.mykyda.placholderdrones.app.DTO.create.OrderPutDTO;
import com.mykyda.placholderdrones.app.DTO.create.OrderStatsDTO;
import com.mykyda.placholderdrones.app.database.entity.Order;
import com.mykyda.placholderdrones.app.database.entity.PageResponse;
import com.mykyda.placholderdrones.app.database.enums.KitType;
import com.mykyda.placholderdrones.app.database.enums.OrderStatus;
import com.mykyda.placholderdrones.app.database.repository.OrderRepository;
import com.mykyda.placholderdrones.app.database.specification.OrderSpecification;
import com.mykyda.placholderdrones.app.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;

    private final CountyGeoLoader countyGeoLoader;

    @Value("${placeholder-drones.search.filtered-search-page-size}")
    private int FILTERED_SEARCH_PAGE_SIZE;

    @Transactional
    public long save(OrderCreateDTO dto) {

        var county = countyGeoLoader.findCounty(
                dto.getLongitude().doubleValue(),
                dto.getLatitude().doubleValue()
        );

        Order order = Order.builder()
                .receiverEmail(dto.getEmail())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .kitType(dto.getKitType())
                .orderStatus(OrderStatus.WAITING_FOR_PAYMENT)
                .build();

        recountTaxes(
                order,
                county.getTaxRate(),
                dto.getKitType().getSubtotal()
        );

        return orderRepository.save(order).getId();
    }

    @Transactional(readOnly = true)
    public PageResponse<Order> findAllFiltered(Map<String, String> filters) {

        Specification<Order> spec = Specification.allOf();

        if (filters.containsKey("before")) {
            spec = spec.and(OrderSpecification
                    .placeBefore(LocalDate.parse(filters.get("before"))));
        }

        if (filters.containsKey("after")) {
            spec = spec.and(OrderSpecification
                    .placedAfter(LocalDate.parse(filters.get("after"))));
        }

        if (filters.containsKey("orderStatus")) {
            spec = spec.and(OrderSpecification
                    .hasOrderStatus(OrderStatus.valueOf(filters.get("orderStatus").toUpperCase())));
        }

        if (filters.containsKey("email")) {
            spec = spec.and(OrderSpecification
                    .hasEmail(filters.get("email")));
        }

        if (filters.containsKey("kitType")) {
            spec = spec.and(OrderSpecification
                    .hasKitType(KitType.valueOf(filters.get("kitType").toUpperCase())));
        }

        int pageNumber = filters.containsKey("page") && !filters.get("page").isEmpty()
                ? Integer.parseInt(filters.get("page"))
                : 0;

        int size = filters.containsKey("size") && !filters.get("size").isEmpty()
                ? Integer.parseInt(filters.get("size"))
                : FILTERED_SEARCH_PAGE_SIZE;

        Sort sort = Sort.unsorted();

        if (filters.containsKey("sort") && !filters.get("sort").isEmpty()) {
            String[] sortParams = filters.get("sort").split(",");
            String field = sortParams[0];
            String direction = sortParams.length > 1 ? sortParams[1] : "asc";

            sort = direction.equalsIgnoreCase("desc")
                    ? Sort.by(field).descending()
                    : Sort.by(field).ascending();
        }

        PageRequest pageable = PageRequest.of(pageNumber, size, sort);

        Page<Order> page = orderRepository.findAll(spec, pageable);

        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public Order findById(Long id) {
        return orderRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("No order with id " + id));
    }

    @Transactional(readOnly = true)
    public Order getById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    @Transactional
    public void deleteById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No order with id " + id));

        orderRepository.delete(order);
    }

    @Transactional
    public void parseAndSave(MultipartFile file) throws Exception {

        List<Order> result = new ArrayList<>();
        int skipped = 0;

        try (BufferedReader reader =
                     new BufferedReader(new InputStreamReader(file.getInputStream()))) {

            String line;
            boolean isFirstLine = true;

            while ((line = reader.readLine()) != null) {

                if (isFirstLine) {
                    isFirstLine = false;
                    continue;
                }

                try {

                    var columns = line.split(",");

                    var formatter =
                            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSSSSSSSS");

                    var ldt = LocalDateTime.parse(columns[3], formatter);
                    var timestamp = Timestamp.from(ldt.toInstant(ZoneOffset.UTC));

                    var subtotal = new BigDecimal(columns[4]);
                    var latitude = new BigDecimal(columns[2]);
                    var longitude = new BigDecimal(columns[1]);

                    var county = countyGeoLoader
                            .findCounty(longitude.doubleValue(), latitude.doubleValue());

                    var tax = county.getTaxRate();
                    var taxAmount = subtotal.multiply(tax);

                    Order order = Order.builder()
                            .longitude(longitude)
                            .latitude(latitude)
                            .timestamp(timestamp)
                            .subtotal(subtotal)
                            .compositeTax(tax)
                            .taxAmount(taxAmount)
                            .totalAmount(subtotal.add(taxAmount))
                            .kitType(KitType.fromSubtotal(subtotal))
                            .orderStatus(OrderStatus.ORDERED)
                            .build();

                    result.add(order);
                    if (result.size() == 500) {
                        orderRepository.saveAll(result);
                        log.debug("batch saved");
                        result.clear();
                    }
                } catch (Exception e) {
                    skipped++;
                    log.debug("Skipping invalid row: {}", line);
                }
            }
        }

        if (!result.isEmpty()) {
            var saved = orderRepository.saveAll(result);
            log.info("Import finished. Saved: {}, Skipped: {}", saved.size(), skipped);
        }
    }

    @Transactional(readOnly = true)
    public OrderStatsDTO getStats() {
        return OrderStatsDTO.builder()
                .totalOrders(orderRepository.count())
                .totalTax(orderRepository.sumTax())
                .totalPending(orderRepository.getSumOrdersByOrderStatus(OrderStatus.WAITING_FOR_PAYMENT))
                .build();
    }

    @Transactional
    public void put(long id, OrderPutDTO dto) {

        var order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No order with id " + id));

        boolean changed = false;

        if (dto.getLatitude() != null && dto.getLongitude() != null) {
            var county = countyGeoLoader.findCounty(
                    dto.getLongitude().doubleValue(),
                    dto.getLatitude().doubleValue()
            );
            order.setLatitude(dto.getLatitude());
            order.setLongitude(dto.getLongitude());
            recountTaxes(
                    order,
                    county.getTaxRate(),
                    order.getKitType().getSubtotal()
            );
            changed = true;
        }
        if (dto.getKitType() != null && dto.getKitType() != order.getKitType()) {
            order.setKitType(dto.getKitType());
            recountTaxes(
                    order,
                    order.getCompositeTax(),
                    dto.getKitType().getSubtotal()
            );
            changed = true;
        }
        if (dto.getReceiverEmail() != null && !dto.getReceiverEmail().isBlank()) {
            order.setReceiverEmail(dto.getReceiverEmail());
            changed = true;
        }
        if (dto.getOrderStatus() != null) {
            order.setOrderStatus(dto.getOrderStatus());
            changed = true;
        }

        if (changed) {
            orderRepository.save(order);
        }
    }

    private void recountTaxes(Order order, BigDecimal taxRate, BigDecimal subtotal) {

        BigDecimal taxAmount = subtotal
                .multiply(taxRate)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal total = subtotal
                .add(taxAmount)
                .setScale(2, RoundingMode.HALF_UP);

        order.setSubtotal(subtotal);
        order.setCompositeTax(taxRate);
        order.setTaxAmount(taxAmount);
        order.setTotalAmount(total);
    }

    @Transactional
    public void setPayedById(long id) {
        var order = orderRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("No order with id " + id));
        if (order.getOrderStatus().equals(OrderStatus.WAITING_FOR_PAYMENT)) {
            order.setOrderStatus(OrderStatus.ORDERED);
            orderRepository.save(order);
        }
    }

    public void update(Order order) {
        orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOnTheWayOrder() {
        return orderRepository.getAllByOrderStatusIs(OrderStatus.ON_THE_WAY);
    }
}
