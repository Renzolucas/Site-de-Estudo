package com.studyos.api.service.auth;

import com.studyos.api.dto.auth.request.ChangePasswordRequest;
import com.studyos.api.dto.auth.request.ForgotPasswordRequest;
import com.studyos.api.dto.auth.request.LoginRequest;
import com.studyos.api.dto.auth.request.ResetPasswordRequest;
import com.studyos.api.dto.auth.request.VerifyResetCodeRequest;
import com.studyos.api.dto.auth.response.AuthResponse;
import com.studyos.api.dto.auth.response.ChangePasswordResponse;
import com.studyos.api.dto.auth.response.ForgotPasswordResponse;
import com.studyos.api.dto.auth.response.ResetPasswordResponse;
import com.studyos.api.dto.auth.response.VerifyResetCodeResponse;
import com.studyos.api.dto.user.request.UserRegisterRequest;
import com.studyos.api.dto.user.response.UserResponse;
import com.studyos.api.exception.custom.BusinessRuleException;
import com.studyos.api.exception.custom.ResourceNotFoundException;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.NotificationType;
import com.studyos.api.repository.user.UserRepository;
import com.studyos.api.service.notification.NotificationService;
import com.studyos.api.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final JwtTokenService jwtTokenService;
    private final PasswordResetService passwordResetService;
    private final NotificationService notificationService;

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        return passwordResetService.forgotPassword(request);
    }

    @Transactional
    public VerifyResetCodeResponse verifyResetCode(VerifyResetCodeRequest request) {
        return passwordResetService.verifyResetCode(request);
    }

    @Transactional
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        return passwordResetService.resetPassword(request);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new BusinessRuleException("Credenciais inválidas: e-mail ou senha incorretos."));

        // Verificação de senha
        if (!user.getPassword().equals(request.password())) {
            throw new BusinessRuleException("Credenciais inválidas: e-mail ou senha incorretos.");
        }

        String token = jwtTokenService.generateToken(user);
        return AuthResponse.of(token, userService.findById(user.getId()));
    }

    @Transactional
    public AuthResponse register(UserRegisterRequest request) {
        UserResponse registered = userService.register(request);
        User user = userRepository.findById(registered.id())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        String token = jwtTokenService.generateToken(user);
        return AuthResponse.of(token, registered);
    }

    @Transactional
    public UserResponse getAuthenticatedUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BusinessRuleException("Token de autorização não fornecido ou formato inválido.");
        }

        String token = authHeader.substring(7).trim();
        if (!jwtTokenService.validateToken(token)) {
            throw new BusinessRuleException("Token JWT inválido ou expirado.");
        }

        Long userId = jwtTokenService.extractUserId(token);
        if (userId == null) {
            String email = jwtTokenService.extractEmail(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário do token não encontrado."));
            return userService.findById(user.getId());
        }

        return userService.findById(userId);
    }

    @Transactional
    public ChangePasswordResponse changePassword(String authHeader, ChangePasswordRequest request) {
        User user = userService.getAuthenticatedUserEntity(authHeader);

        if (request == null || request.currentPassword() == null || request.newPassword() == null) {
            throw new BusinessRuleException("A senha atual e a nova senha são obrigatórias.");
        }

        if (!user.getPassword().equals(request.currentPassword())) {
            throw new BusinessRuleException("Senha atual incorreta.");
        }

        if (user.getPassword().equals(request.newPassword())) {
            throw new BusinessRuleException("A nova senha deve ser diferente da senha atual.");
        }

        if (request.newPassword().length() < 6) {
            throw new BusinessRuleException("A nova senha deve ter no mínimo 6 caracteres.");
        }

        user.setPassword(request.newPassword());
        userRepository.save(user);

        notificationService.createNotificationSilently(
                user,
                NotificationType.PASSWORD_CHANGED,
                "Senha alterada",
                "Sua senha foi alterada. Se não foi você, entre em contato com o suporte.",
                null
        );

        return new ChangePasswordResponse("Senha alterada com sucesso.");
    }
}
