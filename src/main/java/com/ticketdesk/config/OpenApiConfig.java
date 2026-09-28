package com.ticketdesk.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI ticketDeskOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TicketDesk – Campus Movie/Show Ticket Booking System API")
                        .description("Production-style REST API for managing college auditorium show bookings, real-time seat availability, cancellation handling, and concurrency protection against overbooking.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("TicketDesk Engineering Team")
                                .email("support@ticketdesk.campus.edu")
                                .url("https://ticketdesk.campus.edu"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development Server")
                ));
    }
}
