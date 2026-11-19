package com.studyos.api.controller;

import com.studyos.api.dto.admin.request.CreateAnnouncementRequest;
import com.studyos.api.dto.admin.request.CreateUserRequest;
import com.studyos.api.dto.admin.request.UpdateMentorRequest;
import com.studyos.api.dto.admin.request.UpdateRoleRequest;
import com.studyos.api.dto.admin.request.UpdateStatusRequest;
import com.studyos.api.dto.admin.response.AdminMentorSummaryResponse;
import com.studyos.api.dto.admin.response.AdminOverviewResponse;
import com.studyos.api.dto.admin.response.AdminUserResponse;
import com.studyos.api.dto.admin.response.AnnouncementResponse;
import com.studyos.api.model.enums.UserRole;
import com.studyos.api.service.admin.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewResponse> getOverview(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(adminService.getOverview(authHeader));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getUsers(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean noMentor) {
        return ResponseEntity.ok(adminService.getUsers(authHeader, search, role, status, noMentor));
    }

    @GetMapping("/mentors")
    public ResponseEntity<List<AdminMentorSummaryResponse>> getActiveMentors(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(adminService.getActiveMentors(authHeader));
    }

    @PostMapping("/users")
    public ResponseEntity<AdminUserResponse> createUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CreateUserRequest request) {
        AdminUserResponse response = adminService.createUser(authHeader, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(adminService.updateUserRole(authHeader, id, request));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<AdminUserResponse> updateUserStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(adminService.updateUserStatus(authHeader, id, request));
    }

    @PatchMapping("/users/{id}/mentor")
    public ResponseEntity<AdminUserResponse> updateUserMentor(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody(required = false) UpdateMentorRequest request) {
        return ResponseEntity.ok(adminService.updateUserMentor(authHeader, id, request));
    }

    @PostMapping("/announcements")
    public ResponseEntity<AnnouncementResponse> createAnnouncement(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CreateAnnouncementRequest request) {
        AnnouncementResponse response = adminService.createAnnouncement(authHeader, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/announcements")
    public ResponseEntity<List<AnnouncementResponse>> getAnnouncements(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(adminService.getAnnouncements(authHeader));
    }
}
