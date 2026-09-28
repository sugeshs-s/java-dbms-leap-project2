package com.ticketdesk.service;

import com.ticketdesk.dto.StudentRequest;
import com.ticketdesk.dto.StudentResponse;
import com.ticketdesk.entity.Student;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.repository.StudentRepository;
import com.ticketdesk.service.impl.StudentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private StudentServiceImpl studentService;

    private Student student;
    private StudentRequest studentRequest;

    @BeforeEach
    void setUp() {
        student = Student.builder()
                .id(1L)
                .name("Jackie")
                .email("jackie@campus.edu")
                .department("Computer Science")
                .createdAt(LocalDateTime.now())
                .build();

        studentRequest = StudentRequest.builder()
                .name("Jackie")
                .email("jackie@campus.edu")
                .department("Computer Science")
                .build();
    }

    @Test
    @DisplayName("Create student successfully")
    void testCreateStudent_Success() {
        when(studentRepository.existsByEmail(studentRequest.getEmail())).thenReturn(false);
        when(studentRepository.save(any(Student.class))).thenReturn(student);

        StudentResponse response = studentService.createStudent(studentRequest);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Jackie");
        assertThat(response.getEmail()).isEqualTo("jackie@campus.edu");
        verify(studentRepository, times(1)).save(any(Student.class));
    }

    @Test
    @DisplayName("Create student fails when email already exists")
    void testCreateStudent_DuplicateEmail_ThrowsException() {
        when(studentRepository.existsByEmail(studentRequest.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> studentService.createStudent(studentRequest))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("already exists");

        verify(studentRepository, never()).save(any(Student.class));
    }

    @Test
    @DisplayName("Get student by ID successfully")
    void testGetStudentById_Success() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));

        StudentResponse response = studentService.getStudentById(1L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Get student by ID throws ResourceNotFoundException when not found")
    void testGetStudentById_NotFound() {
        when(studentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentService.getStudentById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Student not found with id: 999");
    }

    @Test
    @DisplayName("Get all students returns list")
    void testGetAllStudents() {
        when(studentRepository.findAll()).thenReturn(List.of(student));

        List<StudentResponse> list = studentService.getAllStudents();

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getName()).isEqualTo("Jackie");
    }

    @Test
    @DisplayName("Update student successfully")
    void testUpdateStudent_Success() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(studentRepository.existsByEmailAndIdNot("jackie@campus.edu", 1L)).thenReturn(false);
        when(studentRepository.save(any(Student.class))).thenReturn(student);

        StudentResponse response = studentService.updateStudent(1L, studentRequest);

        assertThat(response).isNotNull();
        verify(studentRepository).save(any(Student.class));
    }

    @Test
    @DisplayName("Delete student successfully")
    void testDeleteStudent_Success() {
        when(studentRepository.existsById(1L)).thenReturn(true);
        doNothing().when(studentRepository).deleteById(1L);

        studentService.deleteStudent(1L);

        verify(studentRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Delete student throws ResourceNotFoundException when not found")
    void testDeleteStudent_NotFound() {
        when(studentRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> studentService.deleteStudent(999L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(studentRepository, never()).deleteById(anyLong());
    }
}
