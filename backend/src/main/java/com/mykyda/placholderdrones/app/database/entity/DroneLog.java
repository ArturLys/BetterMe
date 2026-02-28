package com.mykyda.placholderdrones.app.database.entity;

import com.mykyda.placholderdrones.app.database.enums.DeliveryStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "drone_log",
        indexes = {
                @Index(name = "idx_drone_log_drone", columnList = "drone_id"),
                @Index(name = "idx_drone_log_order", columnList = "order_id")
        })
public class DroneLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "drone_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Drone drone;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Order order;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime startedAt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DeliveryStatus deliveryStatus = DeliveryStatus.IN_PROGRESS;

    private LocalDateTime finishedAt;
}