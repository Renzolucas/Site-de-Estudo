package com.studyos.api.repository.timelog;

import com.studyos.api.model.TimeLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {

    List<TimeLog> findByTaskId(Long taskId);

    List<TimeLog> findByTaskUserId(Long userId);

    Page<TimeLog> findByTaskUserId(Long userId, Pageable pageable);

    Optional<TimeLog> findByIdAndTaskUserId(Long id, Long userId);

    List<TimeLog> findByTaskUserIdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(tl.loggedDurationMinutes), 0) FROM TimeLog tl WHERE tl.task.user.id = :userId")
    Long sumTotalStudyMinutesByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(tl.loggedDurationMinutes), 0) FROM TimeLog tl " +
           "WHERE tl.task.user.id = :userId AND tl.createdAt BETWEEN :start AND :end")
    Long sumStudyMinutesByUserIdAndPeriod(@Param("userId") Long userId,
                                         @Param("start") LocalDateTime start,
                                         @Param("end") LocalDateTime end);
}
