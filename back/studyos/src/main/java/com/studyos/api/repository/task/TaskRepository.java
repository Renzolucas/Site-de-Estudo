package com.studyos.api.repository.task;

import com.studyos.api.model.Task;
import com.studyos.api.model.enums.SeasonCode;
import com.studyos.api.model.enums.TaskCategory;
import com.studyos.api.model.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUserId(Long userId);

    Page<Task> findByUserId(Long userId, Pageable pageable);

    Optional<Task> findByIdAndUserId(Long id, Long userId);

    List<Task> findByUserIdAndStatus(Long userId, TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.seasonEntity.code = :season")
    List<Task> findByUserIdAndSeason(@Param("userId") Long userId, @Param("season") SeasonCode season);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.seasonEntity.id = :seasonId")
    List<Task> findByUserIdAndSeasonId(@Param("userId") Long userId, @Param("seasonId") Long seasonId);

    List<Task> findByUserIdAndCategory(Long userId, TaskCategory category);

    List<Task> findByUserIdAndTargetDate(Long userId, LocalDate targetDate);

    long countByUserIdAndStatus(Long userId, TaskStatus status);
}
