package com.mypocket.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.mypocket.app.adapters.AiChatAdapter;
import com.mypocket.app.databinding.FragmentAiBinding;
import com.mypocket.app.models.AiChatResponse;
import com.mypocket.app.models.AiHistoryResponse;
import com.mypocket.app.repository.AiRepository;

import java.lang.reflect.Field;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AiFragment extends Fragment {

    private FragmentAiBinding binding;
    private AiRepository aiRepository;
    private AiChatAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentAiBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        aiRepository = new AiRepository(requireContext());
        adapter = new AiChatAdapter();

        binding.rvChat.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.rvChat.setAdapter(adapter);

        binding.btnSend.setOnClickListener(v -> {
            String text = binding.etMessage.getText().toString().trim();
            if (!text.isEmpty()) {
                sendMessage(text);
            }
        });

        loadHistory();
    }

    private void loadHistory() {
        aiRepository.getHistory(new Callback<AiHistoryResponse>() {
            @Override
            public void onResponse(@NonNull Call<AiHistoryResponse> call, @NonNull Response<AiHistoryResponse> response) {
                if (isAdded() && response.isSuccessful() && response.body() != null) {
                    adapter.setMessages(response.body().getHistory());
                }
            }

            @Override
            public void onFailure(@NonNull Call<AiHistoryResponse> call, @NonNull Throwable t) {
            }
        });
    }

    private void sendMessage(String message) {
        binding.etMessage.setText("");

        AiHistoryResponse.ChatItem userTurn = new AiHistoryResponse.ChatItem();
        try {
            Field roleField = userTurn.getClass().getDeclaredField("role");
            roleField.setAccessible(true);
            roleField.set(userTurn, "user");

            Field msgField = userTurn.getClass().getDeclaredField("message");
            msgField.setAccessible(true);
            msgField.set(userTurn, message);
        } catch (Exception ignored) {}

        adapter.addMessage(userTurn);
        binding.rvChat.smoothScrollToPosition(adapter.getItemCount() - 1);

        aiRepository.sendMessage(message, new Callback<AiChatResponse>() {
            @Override
            public void onResponse(@NonNull Call<AiChatResponse> call, @NonNull Response<AiChatResponse> response) {
                if (isAdded()) {
                    if (response.isSuccessful() && response.body() != null) {
                        AiHistoryResponse.ChatItem aiTurn = new AiHistoryResponse.ChatItem();
                        try {
                            Field roleField = aiTurn.getClass().getDeclaredField("role");
                            roleField.setAccessible(true);
                            roleField.set(aiTurn, "assistant");

                            Field msgField = aiTurn.getClass().getDeclaredField("message");
                            msgField.setAccessible(true);
                            msgField.set(aiTurn, response.body().getReply());
                        } catch (Exception ignored) {}

                        adapter.addMessage(aiTurn);
                        binding.rvChat.smoothScrollToPosition(adapter.getItemCount() - 1);
                    } else {
                        Toast.makeText(requireContext(), "AI failed to respond", Toast.LENGTH_SHORT).show();
                    }
                }
            }

            @Override
            public void onFailure(@NonNull Call<AiChatResponse> call, @NonNull Throwable t) {
                if (isAdded()) {
                    Toast.makeText(requireContext(), "Network error", Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
