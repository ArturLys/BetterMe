package com.mykyda.placholderdrones.app.database.specification;

import com.mykyda.placholderdrones.app.database.enums.KitType;
import com.mykyda.placholderdrones.app.database.entity.Order;
import com.mykyda.placholderdrones.app.database.enums.OrderStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class OrderSpecification {

    public static Specification<Order> hasEmail(String email) {
        return (root, query, builder) ->
                builder.equal(root.get("receiverEmail"), email);
    }

    public static Specification<Order> hasOrderStatus(OrderStatus orderStatus) {
        return (root, query, builder) ->
                builder.equal(root.get("orderStatus"), orderStatus);
    }

    public static Specification<Order> hasKitType(KitType kitType) {
        return (root, query, builder) ->
                builder.equal(root.get("kitType"), kitType);
    }

    public static Specification<Order> placedAfter(LocalDate date) {
        return (root, query, builder) ->
                builder.greaterThanOrEqualTo(root.get("placedAt"), date);
    }

    public static Specification<Order> placeBefore(LocalDate date) {
        return (root, query, builder) ->
                builder.lessThanOrEqualTo(root.get("placedAt"), date);
    }
}
