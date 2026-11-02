package com.studyos.api.service.season;

import com.studyos.api.dto.season.request.SeasonUpdateDTO;
import com.studyos.api.dto.season.response.SeasonResponse;
import com.studyos.api.exception.custom.ResourceNotFoundException;
import com.studyos.api.model.Season;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.SeasonCode;
import com.studyos.api.repository.season.SeasonRepository;
import com.studyos.api.service.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SeasonServiceTest {

    @Mock
    private SeasonRepository seasonRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private SeasonService seasonService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Aluno Teste")
                .email("aluno@studyos.com")
                .build();
    }

    @Test
    @DisplayName("findByUserId - Quando usuário não possui estações, deve inicializar as 4 estações padrão")
    void shouldInitializeDefaultSeasonsWhenUserHasNone() {
        when(userService.findEntityById(1L)).thenReturn(testUser);
        when(seasonRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        List<Season> created = List.of(
                Season.builder().id(1L).code(SeasonCode.SUMMER).title("Verão").quarter("Q1").user(testUser).build(),
                Season.builder().id(2L).code(SeasonCode.AUTUMN).title("Outono").quarter("Q2").user(testUser).build(),
                Season.builder().id(3L).code(SeasonCode.WINTER).title("Inverno").quarter("Q3").user(testUser).build(),
                Season.builder().id(4L).code(SeasonCode.SPRING).title("Primavera").quarter("Q4").user(testUser).build()
        );
        when(seasonRepository.saveAll(anyList())).thenReturn(created);

        List<SeasonResponse> result = seasonService.findByUserId(1L);

        assertEquals(4, result.size());
        assertEquals(SeasonCode.SUMMER, result.get(0).code());
        assertEquals("Q1", result.get(0).quarter());
        assertEquals(SeasonCode.AUTUMN, result.get(1).code());
        assertEquals("Q2", result.get(1).quarter());
        assertEquals(SeasonCode.WINTER, result.get(2).code());
        assertEquals("Q3", result.get(2).quarter());
        assertEquals(SeasonCode.SPRING, result.get(3).code());
        assertEquals("Q4", result.get(3).quarter());
        verify(seasonRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("findByUserId - Quando usuário já possui estações, deve retornar sem reinicializar")
    void shouldReturnExistingSeasonsWithoutReinitializing() {
        when(userService.findEntityById(1L)).thenReturn(testUser);
        List<Season> existing = List.of(
                Season.builder().id(10L).code(SeasonCode.SUMMER).title("Meu Verão").quarter("Q1").user(testUser).build()
        );
        when(seasonRepository.findByUserId(1L)).thenReturn(existing);

        List<SeasonResponse> result = seasonService.findByUserId(1L);

        assertEquals(1, result.size());
        assertEquals("Meu Verão", result.get(0).title());
        verify(seasonRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("update - Deve atualizar título e descrição de uma estação existente")
    void shouldUpdateSeasonTitleAndDescription() {
        Season existing = Season.builder()
                .id(1L)
                .code(SeasonCode.SUMMER)
                .title("Verão")
                .description("Descrição antiga")
                .quarter("Q1")
                .user(testUser)
                .build();

        when(seasonRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(seasonRepository.save(any(Season.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SeasonUpdateDTO dto = new SeasonUpdateDTO("Verão Turbinado", "Nova descrição focada em backend");
        SeasonResponse updated = seasonService.update(1L, dto);

        assertEquals("Verão Turbinado", updated.title());
        assertEquals("Nova descrição focada em backend", updated.description());
        verify(seasonRepository).save(existing);
    }

    @Test
    @DisplayName("findById - Deve lançar ResourceNotFoundException para ID inexistente")
    void shouldThrowWhenSeasonNotFound() {
        when(seasonRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> seasonService.findById(99L));
    }
}
