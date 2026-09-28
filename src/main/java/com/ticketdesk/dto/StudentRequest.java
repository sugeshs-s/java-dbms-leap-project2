package com.ticketdesk.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request body for creating or updating a student")
public class StudentRequest {

    @NotBlank(message = "Name cannot be blank")
    @Schema(description = "Full name of the student", example = "Jackie")
    private String name;

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Email must be valid")
    @Schema(description = "Email address of the student", example = "jackie@campus.edu")
    private String email;

    @Schema(description = "Department of the student", example = "Computer Science")
    private String department;
}
