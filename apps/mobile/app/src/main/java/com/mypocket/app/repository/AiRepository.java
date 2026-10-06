package com.mypocket.app.repository;

import android.content.Context;

import com.mypocket.app.models.AiChatRequest;
import com.mypocket.app.models.AiChatResponse;
import com.mypocket.app.models.AiHistoryResponse;
import com.mypocket.app.network.ApiClient;
import com.mypocket.app.network.ApiService;

import retrofit2.Callback;

public class AiRepository {
    private final ApiService apiService;

    public AiRepository(Context context) {
        this.apiService = ApiClient.getService(context);
    }

    public void sendMessage(String message, Callback<AiChatResponse> callback) {
        apiService.chatWithAi(new AiChatRequest(message)).enqueue(callback);
    }

    public void getHistory(Callback<AiHistoryResponse> callback) {
        apiService.getAiHistory().enqueue(callback);
    }
}
