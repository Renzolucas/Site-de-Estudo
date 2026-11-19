package com.studyos.api.controller;

import com.studyos.api.dto.admin.response.AnnouncementResponse;
import com.studyos.api.dto.mentor.request.CreateMentorAnnouncementRequest;
import com.studyos.api.dto.mentor.response.MentorOverviewResponse;
import com.studyos.api.dto.mentor.response.MentorStudentDetailResponse;
import com.studyos.api.dto.mentor.response.MentorStudentSummaryResponse;
import com.studyos.api.service.mentor.MentorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mentor")
@RequiredArgsConstructor
public class MentorController {

    private final MentorService mentorService;

    @GetMapping("/overview")
    public ResponseEntity<MentorOverviewResponse> getOverview(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(mentorService.getOverview(authHeader));
    }

    @GetMapping("/students")
    public ResponseEntity<List<MentorStudentSummaryResponse>> getStudents(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(mentorService.getStudents(authHeader, search));
    }

    @GetMapping("/students/{id}")
    public ResponseEntity<MentorStudentDetailResponse> getStudentDetail(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        return ResponseEntity.ok(mentorService.getStudentDetail(authHeader, id));
    }

    @PostMapping("/announcements")
    public ResponseEntity<AnnouncementResponse> createAnnouncement(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CreateMentorAnnouncementRequest request) {
        AnnouncementResponse response = mentorService.createAnnouncement(authHeader, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/announcements")
    public ResponseEntity<List<AnnouncementResponse>> getAnnouncements(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(mentorService.getAnnouncements(authHeader));
    }
}
