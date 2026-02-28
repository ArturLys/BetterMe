package com.mykyda.placholderdrones.app.service;

import com.mykyda.placholderdrones.app.database.entity.CountyPolygon;
import com.mykyda.placholderdrones.app.database.entity.Point;
import com.mykyda.placholderdrones.app.exception.LocationException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class CountyGeoLoader {

    private final List<CountyPolygon> counties = new ArrayList<>();

    private final TaxRateService taxRateService;

    @Value("${placeholder-drones.files.county-file-name}")
    private String COUNTY_FILE_NAME;

    @PostConstruct
    public void load() {

        log.info("Initializing County Geo Loader");

        var mapper = new ObjectMapper();

        var inputStream = getClass()
                .getClassLoader()
                .getResourceAsStream(COUNTY_FILE_NAME);

        var root = mapper.readTree(inputStream);
        var features = root.get("features");

        for (JsonNode feature : features) {

            var name = feature
                    .get("properties")
                    .get("name")
                    .asString();

            var coordinates = feature
                    .get("geometry")
                    .get("coordinates");

            List<List<Point>> polygons = new ArrayList<>();

            var minLat = Double.MAX_VALUE;
            var maxLat = -Double.MAX_VALUE;
            var minLon = Double.MAX_VALUE;
            var maxLon = -Double.MAX_VALUE;

            for (JsonNode polygonNode : coordinates) {
                for (JsonNode ringNode : polygonNode) {

                    List<Point> polygon = new ArrayList<>();

                    for (JsonNode pointNode : ringNode) {

                        double lon = pointNode.get(0).asDouble();
                        double lat = pointNode.get(1).asDouble();

                        polygon.add(new Point(lon, lat));

                        minLat = Math.min(minLat, lat);
                        maxLat = Math.max(maxLat, lat);
                        minLon = Math.min(minLon, lon);
                        maxLon = Math.max(maxLon, lon);
                    }

                    polygons.add(polygon);
                }
            }

            var county = CountyPolygon.builder()
                    .name(name)
                    .taxRate(resolveTaxRate(name))
                    .polygons(polygons)
                    .minLat(minLat)
                    .maxLat(maxLat)
                    .minLon(minLon)
                    .maxLon(maxLon)
                    .build();

            counties.add(county);
        }
    }

    private BigDecimal resolveTaxRate(String countyName) {
        return taxRateService.resolveTaxRate(countyName);
    }

    public CountyPolygon findCounty(double lon, double lat) {
        for (CountyPolygon county : counties) {
            if (county.contains(lon, lat)) {
                return county;
            }
        }
        throw new LocationException("Specified point if out of bounds");
    }
}