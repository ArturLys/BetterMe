package com.mykyda.placholderdrones.app.database.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CountyPolygon {

    private String name;

    private BigDecimal taxRate;

    private List<List<Point>> polygons;

    private double minLat;

    private double maxLat;

    private double minLon;

    private double maxLon;

    public boolean contains(double lon, double lat) {
        if (lat < minLat || lat > maxLat || lon < minLon || lon > maxLon) {
            return false;
        }
        for (List<Point> polygon : polygons) {
            if (isPointInPolygon(lon, lat, polygon)) {
                return true;
            }
        }
        return false;
    }

    private boolean isPointInPolygon(double lon, double lat, List<Point> polygon) {

        boolean inside = false;
        int n = polygon.size();

        for (int i = 0, j = n - 1; i < n; j = i++) {

            double xi = polygon.get(i).lon();
            double yi = polygon.get(i).lat();
            double xj = polygon.get(j).lon();
            double yj = polygon.get(j).lat();

            boolean intersect =
                    ((yi > lat) != (yj > lat)) &&
                            (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            if (intersect) {
                inside = !inside;
            }
        }
        return inside;
    }
}