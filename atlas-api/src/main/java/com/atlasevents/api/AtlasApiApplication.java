package com.atlasevents.api;

import com.atlasevents.api.shared.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class AtlasApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(AtlasApiApplication.class, args);
    }
}
