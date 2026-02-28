package com.mykyda.placholderdrones.app.DTO.demo;

import com.mykyda.placholderdrones.app.database.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderDTO {

    long id;

    String receiverEmail;

    BigDecimal latitude;

    BigDecimal longitude;

    OrderStatus orderStatus;
}
