package com.mykyda.placholderdrones.app.DTO.demo;

import com.mykyda.placholderdrones.app.database.enums.KitType;
import com.mykyda.placholderdrones.app.database.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderDemoDTO {

    long id;

    String receiverEmail;

    BigDecimal latitude;

    BigDecimal longitude;

    OrderStatus orderStatus;

    DroneDTO drone;

    BigDecimal subtotal;

    BigDecimal compositeTax;

    BigDecimal taxAmount;

    BigDecimal totalAmount;

    Timestamp timestamp = Timestamp.from(Instant.now());

    KitType kitType;
}
