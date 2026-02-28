package com.mykyda.placholderdrones.app.database.entity;

import com.mykyda.placholderdrones.app.database.enums.KitType;
import com.mykyda.placholderdrones.app.database.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String receiverEmail;

    @Column(precision = 9, scale = 6, nullable = false)
    private BigDecimal latitude;

    @Column(precision = 9, scale = 6, nullable = false)
    private BigDecimal longitude;

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(nullable = false)
    private BigDecimal compositeTax;

    @Column(nullable = false)
    private BigDecimal taxAmount;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private Timestamp timestamp = Timestamp.from(Instant.now());

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private KitType kitType = KitType.DEFAULT;

    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus;
}
