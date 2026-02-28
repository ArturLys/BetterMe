package com.mykyda.placholderdrones.app.database.enums;

import lombok.Getter;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Objects;

@Getter
public enum KitType {

    DEFAULT(new BigDecimal("22.00")),
    DEFAULT_PLUS(new BigDecimal("25.00")),

    SILVER(new BigDecimal("45.00")),
    SILVER_PLUS(new BigDecimal("50.00")),

    GOLD(new BigDecimal("108.00")),
    GOLD_PLUS(new BigDecimal("120.00")),

    PLATINUM(new BigDecimal("180.00")),
    PLATINUM_PLUS(new BigDecimal("200.00"));

    private final BigDecimal subtotal;

    KitType(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public static KitType fromSubtotal(BigDecimal subtotal) {
        return Arrays.stream(values())
                .filter(k -> Objects.equals(k.subtotal.doubleValue(), subtotal.doubleValue()))
                .findFirst()
                .orElseThrow(() ->
                        new IllegalArgumentException("Unknown kit subtotal: " + subtotal)
                );
    }
}