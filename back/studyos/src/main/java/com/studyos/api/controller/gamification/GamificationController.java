package com.studyos.api.controller.gamification;

import com.studyos.api.dto.gamification.response.LeaderboardUserResponse;
import com.studyos.api.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/gamification")
@RequiredArgsConstructor
public class GamificationController {

    private final UserService userService;

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardUserResponse>> getLeaderboard() {
        return ResponseEntity.ok(userService.getLeaderboard());
    }
}
