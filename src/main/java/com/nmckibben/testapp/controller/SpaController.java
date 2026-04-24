package com.nmckibben.testapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Catches all non-API, non-static-file GET requests and forwards them to index.html
 * so that React Router can handle client-side navigation.
 *
 * <p>The regex {@code [^\\.]*} matches path segments with no dot (i.e. not a file
 * with an extension like {@code .js}, {@code .css}, {@code .png}), which means
 * static assets served directly by Spring's resource handler are unaffected.
 */
@Controller
public class SpaController {

    @GetMapping(value = { "/", "/{path:[^\\.]*}", "/**/{path:[^\\.]*}" })
    public String forward() {
        return "forward:/index.html";
    }
}
