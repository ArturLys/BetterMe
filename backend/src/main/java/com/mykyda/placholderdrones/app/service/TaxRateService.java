package com.mykyda.placholderdrones.app.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class TaxRateService {

    private final Map<String, BigDecimal> taxRates = new HashMap<>();

    @Value("${placeholder-drones.tax.default-tax-rate}")
    private static BigDecimal DEFAULT_TAX_RATE;

    @Value("${placeholder-drones.files.tax-rates-file-name}")
    private String TAX_RATES_FILE_NAME;

    @PostConstruct
    public void loadRates() {
        try (InputStream is = getClass()
                .getClassLoader()
                .getResourceAsStream(TAX_RATES_FILE_NAME);
             var reader = new BufferedReader(new InputStreamReader(is))) {

            reader.lines()
                    .skip(1)
                    .forEach(line -> {
                        var parts = line.split(",");
                        var county = parts[0].trim();
                        var rate = new BigDecimal(parts[1].trim());
                        taxRates.put(county, rate);
                    });
        } catch (Exception e) {
            throw new RuntimeException("Failed to load tax rates", e);
        }
    }

    public BigDecimal resolveTaxRate(String county) {
        return taxRates.getOrDefault(county, DEFAULT_TAX_RATE);
    }
}