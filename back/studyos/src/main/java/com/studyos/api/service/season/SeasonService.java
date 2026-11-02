package com.studyos.api.service.season;

import com.studyos.api.dto.season.request.SeasonUpdateDTO;
import com.studyos.api.dto.season.response.SeasonResponse;
import com.studyos.api.exception.custom.ResourceNotFoundException;
import com.studyos.api.model.Season;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.SeasonCode;
import com.studyos.api.repository.season.SeasonRepository;
import com.studyos.api.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SeasonService {

    private final SeasonRepository seasonRepository;
    private final UserService userService;

    @Transactional
    public List<SeasonResponse> findByUserId(Long userId) {
        User user = userService.findEntityById(userId);
        List<Season> seasons = seasonRepository.findByUserId(userId);

        if (seasons.isEmpty()) {
            seasons = initializeDefaultSeasons(user);
        }

        return seasons.stream()
                .sorted(Comparator.comparing(Season::getQuarter, Comparator.nullsLast(String::compareTo)))
                .map(SeasonResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Season findEntityById(Long id) {
        return seasonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estação não encontrada com o ID: " + id));
    }

    @Transactional(readOnly = true)
    public SeasonResponse findById(Long id) {
        return SeasonResponse.fromEntity(findEntityById(id));
    }

    @Transactional
    public Season getOrCreateSeasonByUserAndCode(Long userId, SeasonCode code) {
        return seasonRepository.findByUserIdAndCode(userId, code)
                .orElseGet(() -> {
                    User user = userService.findEntityById(userId);
                    List<Season> existing = seasonRepository.findByUserId(userId);
                    if (existing.isEmpty()) {
                        List<Season> initialized = initializeDefaultSeasons(user);
                        return initialized.stream()
                                .filter(s -> s.getCode() == code)
                                .findFirst()
                                .orElseThrow(() -> new ResourceNotFoundException("Estação não encontrada para o código: " + code));
                    }
                    Season newSeason = Season.builder()
                            .code(code)
                            .title(getDefaultTitle(code))
                            .description(getDefaultDescription(code))
                            .quarter(getDefaultQuarter(code))
                            .user(user)
                            .build();
                    return seasonRepository.save(newSeason);
                });
    }

    @Transactional
    public SeasonResponse update(Long id, SeasonUpdateDTO dto) {
        Season season = findEntityById(id);

        if (dto.title() != null && !dto.title().isBlank()) {
            season.setTitle(dto.title().trim());
        }
        if (dto.description() != null) {
            season.setDescription(dto.description().trim());
        }

        Season updatedSeason = seasonRepository.save(season);
        return SeasonResponse.fromEntity(updatedSeason);
    }

    @Transactional
    public List<Season> initializeDefaultSeasons(User user) {
        List<Season> defaultSeasons = List.of(
                Season.builder()
                        .code(SeasonCode.SUMMER)
                        .title("Verão")
                        .description("Defina seus objetivos principais para a estação de Verão.")
                        .quarter("Q1")
                        .user(user)
                        .build(),
                Season.builder()
                        .code(SeasonCode.AUTUMN)
                        .title("Outono")
                        .description("Defina seus objetivos principais para a estação de Outono.")
                        .quarter("Q2")
                        .user(user)
                        .build(),
                Season.builder()
                        .code(SeasonCode.WINTER)
                        .title("Inverno")
                        .description("Defina seus objetivos principais para a estação de Inverno.")
                        .quarter("Q3")
                        .user(user)
                        .build(),
                Season.builder()
                        .code(SeasonCode.SPRING)
                        .title("Primavera")
                        .description("Defina seus objetivos principais para a estação de Primavera.")
                        .quarter("Q4")
                        .user(user)
                        .build()
        );
        return seasonRepository.saveAll(defaultSeasons);
    }

    private String getDefaultTitle(SeasonCode code) {
        return switch (code) {
            case SUMMER -> "Verão";
            case AUTUMN -> "Outono";
            case WINTER -> "Inverno";
            case SPRING -> "Primavera";
        };
    }

    private String getDefaultDescription(SeasonCode code) {
        return switch (code) {
            case SUMMER -> "Defina seus objetivos principais para a estação de Verão.";
            case AUTUMN -> "Defina seus objetivos principais para a estação de Outono.";
            case WINTER -> "Defina seus objetivos principais para a estação de Inverno.";
            case SPRING -> "Defina seus objetivos principais para a estação de Primavera.";
        };
    }

    private String getDefaultQuarter(SeasonCode code) {
        return switch (code) {
            case SUMMER -> "Q1";
            case AUTUMN -> "Q2";
            case WINTER -> "Q3";
            case SPRING -> "Q4";
        };
    }
}
