package com.studyos.api.repository.season;

import com.studyos.api.model.Season;
import com.studyos.api.model.enums.SeasonCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeasonRepository extends JpaRepository<Season, Long> {

    List<Season> findByUserId(Long userId);

    List<Season> findByUserIdOrderByQuarterAsc(Long userId);

    Optional<Season> findByUserIdAndCode(Long userId, SeasonCode code);
}
