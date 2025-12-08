"""
Speech to Text Application
A simple GUI application for recording audio and converting it to text.
"""

import tkinter as tk
from tkinter import ttk, scrolledtext
import speech_recognition as sr
import threading
import queue
import pyaudio
import wave
import os
from datetime import datetime


class SpeechToTextApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Speech to Text")
        self.root.geometry("600x500")
        self.root.resizable(True, True)
        
        # Initialize recognizer
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        # Recording state
        self.is_recording = False
        self.audio_queue = queue.Queue()
        self.audio_data = None
        
        # Setup UI
        self.setup_ui()
        
        # Adjust for ambient noise
        self.adjust_for_ambient_noise()
    
    def setup_ui(self):
        """Setup the user interface"""
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(1, weight=1)
        
        # Title
        title_label = ttk.Label(
            main_frame, 
            text="Speech to Text Converter", 
            font=("Arial", 16, "bold")
        )
        title_label.grid(row=0, column=0, pady=(0, 20))
        
        # Control frame
        control_frame = ttk.Frame(main_frame)
        control_frame.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # Mic button
        self.mic_button = tk.Button(
            control_frame,
            text="🎤 Start Recording",
            font=("Arial", 14),
            bg="#4CAF50",
            fg="white",
            activebackground="#45a049",
            activeforeground="white",
            relief=tk.RAISED,
            bd=3,
            padx=20,
            pady=10,
            cursor="hand2",
            command=self.toggle_recording
        )
        self.mic_button.pack(side=tk.LEFT, padx=5)
        
        # Status label
        self.status_label = ttk.Label(
            control_frame,
            text="Ready to record",
            font=("Arial", 10)
        )
        self.status_label.pack(side=tk.LEFT, padx=20)
        
        # Text output area
        text_frame = ttk.LabelFrame(main_frame, text="Transcribed Text", padding="10")
        text_frame.grid(row=2, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        text_frame.columnconfigure(0, weight=1)
        text_frame.rowconfigure(0, weight=1)
        
        self.text_output = scrolledtext.ScrolledText(
            text_frame,
            wrap=tk.WORD,
            width=60,
            height=15,
            font=("Arial", 11)
        )
        self.text_output.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Clear button
        clear_button = ttk.Button(
            main_frame,
            text="Clear Text",
            command=self.clear_text
        )
        clear_button.grid(row=3, column=0, pady=5)
        
        # Info label
        info_label = ttk.Label(
            main_frame,
            text="Click the microphone button to start/stop recording",
            font=("Arial", 9),
            foreground="gray"
        )
        info_label.grid(row=4, column=0, pady=5)
    
    def adjust_for_ambient_noise(self):
        """Adjust recognizer for ambient noise"""
        try:
            with self.microphone as source:
                self.status_label.config(text="Adjusting for ambient noise...")
                self.root.update()
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                self.status_label.config(text="Ready to record")
        except Exception as e:
            self.status_label.config(text=f"Error adjusting noise: {str(e)}")
    
    def toggle_recording(self):
        """Toggle recording on/off"""
        if not self.is_recording:
            self.start_recording()
        else:
            self.stop_recording()
    
    def start_recording(self):
        """Start recording audio"""
        self.is_recording = True
        self.mic_button.config(
            text="⏹ Stop Recording",
            bg="#f44336",
            activebackground="#da190b"
        )
        self.status_label.config(text="Recording... Speak now!")
        
        # Start recording in a separate thread
        self.recording_thread = threading.Thread(target=self.record_audio, daemon=True)
        self.recording_thread.start()
    
    def stop_recording(self):
        """Stop recording and process audio"""
        self.is_recording = False
        self.mic_button.config(
            text="🎤 Start Recording",
            bg="#4CAF50",
            activebackground="#45a049"
        )
        self.status_label.config(text="Processing audio...")
        self.root.update()
    
    def record_audio(self):
        """Record audio from microphone"""
        try:
            with self.microphone as source:
                # Record audio while is_recording is True
                audio = self.recognizer.listen(source, timeout=None, phrase_time_limit=None)
                
                if not self.is_recording:
                    return
                
                # Process the audio
                self.process_audio(audio)
        except sr.WaitTimeoutError:
            if self.is_recording:
                self.status_label.config(text="Recording timeout")
        except Exception as e:
            self.status_label.config(text=f"Recording error: {str(e)}")
            self.is_recording = False
            self.mic_button.config(
                text="🎤 Start Recording",
                bg="#4CAF50",
                activebackground="#45a049"
            )
    
    def process_audio(self, audio):
        """Process recorded audio and convert to text"""
        try:
            # Try Google Speech Recognition first (free, requires internet)
            try:
                text = self.recognizer.recognize_google(audio)
                self.display_text(text)
                self.status_label.config(text="Text transcribed successfully!")
            except sr.UnknownValueError:
                self.status_label.config(text="Could not understand audio")
            except sr.RequestError as e:
                # Fallback to offline recognition if available
                try:
                    text = self.recognizer.recognize_sphinx(audio)
                    self.display_text(text)
                    self.status_label.config(text="Text transcribed (offline mode)")
                except:
                    self.status_label.config(text=f"Recognition error: {str(e)}")
            
            # Reset button state
            if not self.is_recording:
                self.mic_button.config(
                    text="🎤 Start Recording",
                    bg="#4CAF50",
                    activebackground="#45a049"
                )
        except Exception as e:
            self.status_label.config(text=f"Processing error: {str(e)}")
            self.mic_button.config(
                text="🎤 Start Recording",
                bg="#4CAF50",
                activebackground="#45a049"
            )
    
    def display_text(self, text):
        """Display transcribed text in the output area"""
        self.text_output.insert(tk.END, text + "\n")
        self.text_output.see(tk.END)
        self.root.update()
    
    def clear_text(self):
        """Clear the text output area"""
        self.text_output.delete(1.0, tk.END)


def main():
    """Main entry point"""
    root = tk.Tk()
    app = SpeechToTextApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()


