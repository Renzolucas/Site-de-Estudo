package com.studyos.api.service.auth;

import com.studyos.api.dto.auth.request.LoginRequest;
import com.studyos.api.dto.auth.response.AuthResponse;
import com.studyos.api.dto.user.request.UserRegisterRequest;
import com.studyos.api.dto.user.response.UserResponse;
import com.studyos.api.exception.custom.BusinessRuleException;
import com.studyos.api.exception.custom.ResourceNotFoundException;
import com.studyos.api.model.User;
import com.studyos.api.repository.user.UserRepository;
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

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new BusinessRuleException("Credenciais inválidas: e-mail ou senha incorretos."));

        // Verificação de senha
        if (!user.getPassword().equals(request.password())) {
            throw new BusinessRuleException("Credenciais inválidas: e-mail ou senha incorretos.");
        }

        String token = jwtTokenService.generateToken(user);
        return AuthResponse.of(token, UserResponse.fromEntity(user));
    }

    @Transactional
    public AuthResponse register(UserRegisterRequest request) {
        UserResponse registered = userService.register(request);
        User user = userRepository.findById(registered.id())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        String token = jwtTokenService.generateToken(user);
        return AuthResponse.of(token, registered);
    }

    @Transactional(readOnly = true)
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
            return UserResponse.fromEntity(user);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        return UserResponse.fromEntity(user);
    }
}
