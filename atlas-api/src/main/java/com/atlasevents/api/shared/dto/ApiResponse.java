package com.atlasevents.api.shared.dto;

public record ApiResponse<T>(T data, Meta meta, String error) {

    public record Meta(long total, int page, int size) {}

    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(data, null, null);
    }

    public static <T> ApiResponse<T> of(T data, long total, int page, int size) {
        return new ApiResponse<>(data, new Meta(total, page, size), null);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(null, null, message);
    }
}
