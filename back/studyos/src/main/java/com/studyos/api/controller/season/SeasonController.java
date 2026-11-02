package com.studyos.api.controller.season;

import com.studyos.api.dto.season.request.SeasonUpdateDTO;
import com.studyos.api.dto.season.response.SeasonResponse;
import com.studyos.api.service.season.SeasonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/seasons")
@RequiredArgsConstructor
public class SeasonController {

    private final SeasonService seasonService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SeasonResponse>> findByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(seasonService.findByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SeasonResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(seasonService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SeasonResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SeasonUpdateDTO dto) {
        return ResponseEntity.ok(seasonService.update(id, dto));
    }
}
