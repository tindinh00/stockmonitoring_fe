import React, { useEffect, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const StaffChatPage = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedRoom || !newMessage) return;

    // Update room's lastMessage and lastMessageTime
    const roomRef = doc(db, "room", selectedRoom.id);
    await updateDoc(roomRef, {
      lastMessage: selectedImage ? "Đã gửi một hình ảnh" : "Staff: " + newMessage,
      lastMessageTime: serverTimestamp()
    });

    setNewMessage('');
    setSelectedImage(null);
  };

  return (
    <div>
      {/* Rest of the component code */}
    </div>
  );
};

export default StaffChatPage; 