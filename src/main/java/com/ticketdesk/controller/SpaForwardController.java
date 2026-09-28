package com.ticketdesk.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller to forward client-side React Single Page Application routes to index.html.
 */
@Controller
public class SpaForwardController {

    @GetMapping(value = {
        "/shows",
        "/shows/**",
        "/my-bookings",
        "/admin"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
