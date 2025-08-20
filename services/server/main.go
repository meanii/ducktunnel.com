package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"sync"

	"github.com/gorilla/websocket"
)

// We'll need a WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // allowing all domain as of now, TODO: change for production
	},
}

// Room represents a communication room where clients can chat
type Room struct {
	clients map[*websocket.Conn]bool
	mutex   sync.Mutex
}

// We will use a map to store rooms. The key will be the room ID.
var rooms = make(map[string]*Room)
var roomsMutex = sync.Mutex{}

// handleConnections handles incoming WebSocket connections
func handleConnections(w http.ResponseWriter, r *http.Request) {

	// Get room ID from the URL query, e.g., /ws?room=my-room-123
	roomID := r.URL.Query().Get("room")
	if roomID == "" {
		http.Error(w, "Room ID is required", http.StatusBadRequest)
		return
	}

	// Upgrade initial GET request to a WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()

	// Lock the rooms map to safely access it
	roomsMutex.Lock()

	// Find or create the room
	if rooms[roomID] == nil {
		rooms[roomID] = &Room{
			clients: make(map[*websocket.Conn]bool),
		}
	}

	room := rooms[roomID]
	roomsMutex.Unlock()

	// Register the new client
	room.mutex.Lock()
	room.clients[ws] = true
	room.mutex.Unlock()

	log.Printf("Client connected to room: %s. Total clients: %d", roomID, len(room.clients))

	for {
		// Read message from browser
		var msg map[string]any
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err)
			// Remove the client on error
			room.mutex.Lock()
			delete(room.clients, ws)
			room.mutex.Unlock()
			log.Printf("Client disconnected from room: %s. Total clients: %d", roomID, len(room.clients))
			break
		}

		// Broadcast the message to other clients in the same room
		room.mutex.Lock()
		for client := range room.clients {
			// Don't send the message back to the sender
			if client != ws {
				err := client.WriteJSON(msg)
				if err != nil {
					log.Printf("error: %v", err)
					client.Close()
					delete(room.clients, client)
				}
			}
		}
		room.mutex.Unlock()
	}

}

func main() {

	port := flag.String("port", "8000", "-port 8000")
	// tls certs
	notls := flag.Bool("notls", false, "-notls")
	certFile := flag.String("cert", "localhost.pem", "-cert localhost.pem")
	keyFile := flag.String("key", "localhost-key.pem", "-key localhost-key.pem")
	flag.Parse()

	// Configure WebSocket route
	http.HandleFunc("/ws", handleConnections)

	// Use ListenAndServe for non-TLS communication during development
	log.Printf("ducktunnel.com server running on https://0.0.0.0:%s tls: %v", *port, !*notls)

	if !*notls {
		err := http.ListenAndServe(
			fmt.Sprintf("0.0.0.0:%s", *port),
			nil,
		)
		if err != nil {
			log.Fatalf("failed to established ducktunnel.com server %+v", err)
		}
	} else {

		// resolve certFile and keyFile paths
		absCertFile, err := filepath.Abs(*certFile)
		if err != nil {
			log.Fatalf("failed to get absolute path for cert file %+v", err)
		}
		absKeyFile, err := filepath.Abs(*keyFile)
		if err != nil {
			log.Fatalf("failed to get absolute path for key file %+v", err)
		}

		err = http.ListenAndServeTLS(
			fmt.Sprintf(":%s", *port),
			absCertFile,
			absKeyFile,
			nil,
		)

		if err != nil {
			log.Fatalf("failed to established ducktunnel.com server %+v", err)
		}
	}
}
