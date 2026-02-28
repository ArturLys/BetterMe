package com.mykyda.placholderdrones.app.database.repository;

import com.mykyda.placholderdrones.app.database.entity.Order;
import com.mykyda.placholderdrones.app.database.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    @Query("select count(o) from Order o where o.orderStatus = 'WAITING_FOR_PAYMENT'")
    long getSumOrdersByOrderStatus(OrderStatus orderStatus);

    @Query("select coalesce(sum(o.taxAmount),0.0) from Order o")
    double sumTax();

    List<Order> getAllByOrderStatusIs(OrderStatus orderStatus);
}
