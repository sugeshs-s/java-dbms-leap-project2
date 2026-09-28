package com.ticketdesk.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Response containing student details")
public class StudentResponse {

    @Schema(description = "Unique student ID", example = "1")
    private Long id;

    @Schema(description = "Full name of the student", example = "Jackie")
    private String name;

    @Schema(description = "Email address of the student", example = "jackie@campus.edu")
    private String email;

    @Schema(description = "Department of the student", example = "Computer Science")
    private String department;

    @Schema(description = "Date and time when the student record was created")
    private LocalDateTime createdAt;
}
