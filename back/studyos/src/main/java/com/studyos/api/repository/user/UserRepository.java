package com.studyos.api.repository.user;

import com.studyos.api.model.User;
import com.studyos.api.model.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findTop10ByOrderByCurrentXpDesc();

    @Query("SELECT u FROM User u ORDER BY u.currentXp DESC")
    Page<User> findLeaderboard(Pageable pageable);

    long countByRole(UserRole role);

    long countByActive(Boolean active);

    long countByRoleAndActiveTrue(UserRole role);

    long countByRoleAndMentorIsNull(UserRole role);

    List<User> findByRoleAndActiveTrue(UserRole role);

    List<User> findByActiveTrue();

    List<User> findByRoleAndActiveTrueOrderByNameAsc(UserRole role);

    List<User> findByMentorId(Long mentorId);

    List<User> findByMentorIdAndActiveTrue(Long mentorId);

    long countByMentorIdAndActiveTrue(Long mentorId);

    @Query("SELECT u FROM User u WHERE u.mentor.id = :mentorId AND u.active = true " +
           "AND (:search IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY u.name ASC")
    List<User> findActiveStudentsByMentor(@Param("mentorId") Long mentorId, @Param("search") String search);

    @Query("SELECT COALESCE(AVG(u.currentXp), 0.0) FROM User u WHERE u.mentor.id = :mentorId AND u.active = true")
    Double findAverageXpByMentorId(@Param("mentorId") Long mentorId);

    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:active IS NULL OR u.active = :active) AND " +
           "(:noMentor IS NULL OR :noMentor = false OR (u.role = 'STUDENT' AND u.mentor IS NULL)) " +
           "ORDER BY u.id DESC")
    List<User> findUsersWithFilters(@Param("search") String search,
                                    @Param("role") UserRole role,
                                    @Param("active") Boolean active,
                                    @Param("noMentor") Boolean noMentor,
                                    Pageable pageable);
}
