import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { intlLocaleTag, resolveAppLocale } from "@/lib/i18n";

function joinTranscriptParts(...parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

type UseSpeechDictationOptions = {
  text: string;
  onTranscript: (next: string) => void;
};

export function useSpeechDictation({
  text,
  onTranscript,
}: UseSpeechDictationOptions) {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isAvailable] = useState(() => {
    try {
      return ExpoSpeechRecognitionModule.isRecognitionAvailable();
    } catch {
      return false;
    }
  });

  const textRef = useRef(text);
  const onTranscriptRef = useRef(onTranscript);
  const baseTextRef = useRef("");
  const committedRef = useRef("");
  const listeningRef = useRef(false);

  textRef.current = text;
  onTranscriptRef.current = onTranscript;

  const lang = useMemo(
    () => intlLocaleTag(resolveAppLocale(i18n.language)),
    [i18n.language],
  );

  useEffect(() => {
    return () => {
      if (!listeningRef.current) return;
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // ignore teardown errors
      }
    };
  }, []);

  useSpeechRecognitionEvent("start", () => {
    listeningRef.current = true;
    setIsListening(true);
  });

  useSpeechRecognitionEvent("end", () => {
    listeningRef.current = false;
    setIsListening(false);
  });

  useSpeechRecognitionEvent("result", (event) => {
    const piece = event.results[0]?.transcript?.trim() ?? "";
    if (!piece && !event.isFinal) return;

    if (event.isFinal) {
      committedRef.current = joinTranscriptParts(committedRef.current, piece);
      onTranscriptRef.current(
        joinTranscriptParts(baseTextRef.current, committedRef.current),
      );
      return;
    }

    onTranscriptRef.current(
      joinTranscriptParts(baseTextRef.current, committedRef.current, piece),
    );
  });

  useSpeechRecognitionEvent("error", (event) => {
    listeningRef.current = false;
    setIsListening(false);

    if (event.error === "aborted" || event.error === "no-speech") return;

    if (event.error === "not-allowed") {
      Alert.alert(t("ai.title"), t("ai.dictatePermissionDenied"));
      return;
    }

    Alert.alert(t("ai.title"), t("ai.dictateError"));
  });

  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      listeningRef.current = false;
      setIsListening(false);
    }
  }, []);

  const start = useCallback(async () => {
    if (!isAvailable) {
      Alert.alert(t("ai.title"), t("ai.dictateUnavailable"));
      return;
    }

    const permission =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("ai.title"), t("ai.dictatePermissionDenied"));
      return;
    }

    baseTextRef.current = textRef.current.trimEnd();
    committedRef.current = "";

    try {
      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous: true,
      });
    } catch {
      Alert.alert(t("ai.title"), t("ai.dictateError"));
    }
  }, [isAvailable, lang, t]);

  const toggle = useCallback(() => {
    if (listeningRef.current || isListening) {
      stop();
      return;
    }
    void start();
  }, [isListening, start, stop]);

  return {
    isAvailable,
    isListening,
    toggle,
    stop,
  };
}
