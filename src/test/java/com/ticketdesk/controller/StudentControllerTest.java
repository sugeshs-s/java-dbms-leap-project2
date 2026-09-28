package com.ticketdesk.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticketdesk.dto.StudentRequest;
import com.ticketdesk.dto.StudentResponse;
import com.ticketdesk.exception.GlobalExceptionHandler;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.service.StudentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StudentController.class)
@Import(GlobalExceptionHandler.class)
class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StudentService studentService;

    private StudentResponse studentResponse;
    private StudentRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = StudentRequest.builder()
                .name("Jackie")
                .email("jackie@campus.edu")
                .department("Computer Science")
                .build();

        studentResponse = StudentResponse.builder()
                .id(1L)
                .name("Jackie")
                .email("jackie@campus.edu")
                .department("Computer Science")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("POST /api/students returns 201 Created")
    void testCreateStudent_Success() throws Exception {
        when(studentService.createStudent(any(StudentRequest.class))).thenReturn(studentResponse);

        mockMvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Jackie"))
                .andExpect(jsonPath("$.email").value("jackie@campus.edu"));
    }

    @Test
    @DisplayName("POST /api/students returns 400 Bad Request when validation fails")
    void testCreateStudent_ValidationFailure() throws Exception {
        StudentRequest invalidRequest = StudentRequest.builder()
                .name("") // Blank name
                .email("not-an-email") // Invalid email
                .build();

        mockMvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.email").exists());
    }

    @Test
    @DisplayName("GET /api/students/{id} returns 200 OK")
    void testGetStudentById_Success() throws Exception {
        when(studentService.getStudentById(1L)).thenReturn(studentResponse);

        mockMvc.perform(get("/api/students/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Jackie"));
    }

    @Test
    @DisplayName("GET /api/students/{id} returns 404 Not Found")
    void testGetStudentById_NotFound() throws Exception {
        when(studentService.getStudentById(999L)).thenThrow(new ResourceNotFoundException("Student not found with id: 999"));

        mockMvc.perform(get("/api/students/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Student not found with id: 999"));
    }

    @Test
    @DisplayName("GET /api/students returns 200 OK with list")
    void testGetAllStudents() throws Exception {
        when(studentService.getAllStudents()).thenReturn(List.of(studentResponse));

        mockMvc.perform(get("/api/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Jackie"));
    }

    @Test
    @DisplayName("PUT /api/students/{id} returns 200 OK")
    void testUpdateStudent() throws Exception {
        when(studentService.updateStudent(eq(1L), any(StudentRequest.class))).thenReturn(studentResponse);

        mockMvc.perform(put("/api/students/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("DELETE /api/students/{id} returns 204 No Content")
    void testDeleteStudent() throws Exception {
        mockMvc.perform(delete("/api/students/1"))
                .andExpect(status().isNoContent());
    }
}
