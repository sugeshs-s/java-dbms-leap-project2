package com.ticketdesk.service.impl;

import com.ticketdesk.dto.StudentRequest;
import com.ticketdesk.dto.StudentResponse;
import com.ticketdesk.entity.Student;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.repository.StudentRepository;
import com.ticketdesk.service.StudentService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;

    public StudentServiceImpl(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @Override
    @Transactional
    public StudentResponse createStudent(StudentRequest request) {
        if (studentRepository.existsByEmail(request.getEmail())) {
            throw new DataIntegrityViolationException("A student with email '" + request.getEmail() + "' already exists");
        }

        Student student = Student.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .department(request.getDepartment() != null ? request.getDepartment().trim() : null)
                .build();

        Student saved = studentRepository.save(student);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        return mapToResponse(student);
    }

    @Override
    @Transactional
    public StudentResponse updateStudent(Long id, StudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        String newEmail = request.getEmail().trim().toLowerCase();
        if (studentRepository.existsByEmailAndIdNot(newEmail, id)) {
            throw new DataIntegrityViolationException("A student with email '" + newEmail + "' already exists");
        }

        student.setName(request.getName().trim());
        student.setEmail(newEmail);
        student.setDepartment(request.getDepartment() != null ? request.getDepartment().trim() : null);

        Student updated = studentRepository.save(student);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Student not found with id: " + id);
        }
        studentRepository.deleteById(id);
    }

    private StudentResponse mapToResponse(Student student) {
        return StudentResponse.builder()
                .id(student.getId())
                .name(student.getName())
                .email(student.getEmail())
                .department(student.getDepartment())
                .createdAt(student.getCreatedAt())
                .build();
    }
}
