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

    List<Task> findByUserIdAndStartDate(Long userId, LocalDate startDate);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND :date BETWEEN t.startDate AND t.endDate")
    List<Task> findByUserIdAndDateInRange(@Param("userId") Long userId, @Param("date") LocalDate date);

    long countByUserIdAndStatus(Long userId, TaskStatus status);

    long countByStatus(TaskStatus status);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.mentor.id = :mentorId AND t.user.active = true")
    long countTasksByMentorId(@Param("mentorId") Long mentorId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.mentor.id = :mentorId AND t.user.active = true AND t.status = com.studyos.api.model.enums.TaskStatus.COMPLETED")
    long countCompletedTasksByMentorId(@Param("mentorId") Long mentorId);

    @Query("SELECT t.user.id, COUNT(t), SUM(CASE WHEN t.status = com.studyos.api.model.enums.TaskStatus.COMPLETED THEN 1L ELSE 0L END) " +
           "FROM Task t WHERE t.user.mentor.id = :mentorId AND t.user.active = true " +
           "GROUP BY t.user.id")
    List<Object[]> findTaskStatsByMentorStudents(@Param("mentorId") Long mentorId);

    List<Task> findByUserIdOrderByStartDateDesc(Long userId);
}
