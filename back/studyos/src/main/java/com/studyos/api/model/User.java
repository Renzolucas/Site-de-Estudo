package com.studyos.api.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    @Column(name = "user_level", nullable = false)
    private Integer level = 1;

    @Builder.Default
    @Column(name = "current_xp", nullable = false)
    private Long currentXp = 0L;

    @Builder.Default
    @Column(name = "streak_days", nullable = false)
    private Integer streakDays = 0;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    private List<Task> tasks = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.level == null) {
            this.level = 1;
        }
        if (this.currentXp == null) {
            this.currentXp = 0L;
        }
        if (this.streakDays == null) {
            this.streakDays = 0;
        }
    }
}
