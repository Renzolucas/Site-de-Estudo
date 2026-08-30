package com.studyos.api.repository.task;

import com.studyos.api.model.Task;
import com.studyos.api.model.enums.Season;
import com.studyos.api.model.enums.TaskCategory;
import com.studyos.api.model.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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

    List<Task> findByUserIdAndSeason(Long userId, Season season);

    List<Task> findByUserIdAndCategory(Long userId, TaskCategory category);

    List<Task> findByUserIdAndTargetDate(Long userId, LocalDate targetDate);

    long countByUserIdAndStatus(Long userId, TaskStatus status);
}
