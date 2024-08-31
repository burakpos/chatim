import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedUserForOptions, setSelectedUserForOptions] = useState(null);
  const [showWorksPage, setShowWorksPage] = useState(false);

  useEffect(() => {
    if (user) {
      const checkApproval = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && !userDoc.data().approved) {
          alert("Hesap Onayı Gerekiyor. Hesabınız henüz onaylanmadı. Lütfen daha sonra tekrar deneyin.");
          await signOut(auth);
          setUser(null);
        } else {
          loadUsers();
        }
      };
      checkApproval();
    }
  }, [user]);

  const loadUsers = async () => {
    const q = query(collection(db, 'users'));
    const querySnapshot = await getDocs(q);
    const usersList = [];
    querySnapshot.forEach((doc) => {
      if (doc.id !== user.uid) {
        usersList.push({ ...doc.data(), uid: doc.id });
      }
    });
    setUsers(usersList);
  };

  const loadMessages = (chatRoomId) => {
    const q = query(collection(db, 'chatRooms', chatRoomId, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesList = [];
      querySnapshot.forEach((doc) => {
        messagesList.push({ ...doc.data(), id: doc.id });
      });
      setMessages(messagesList);
    });

    return unsubscribe;
  };

  const createChatRoom = async (selectedUser) => {
    const chatRoomId = user.uid > selectedUser.uid 
      ? `${user.uid}_${selectedUser.uid}` 
      : `${selectedUser.uid}_${user.uid}`;
    
    setSelectedChatUser(selectedUser);
    loadMessages(chatRoomId);
  };

  const handleSendMessage = () => {
    if (message.length > 0 && selectedChatUser) {
      const chatRoomId = user.uid > selectedChatUser.uid 
        ? `${user.uid}_${selectedChatUser.uid}` 
        : `${selectedChatUser.uid}_${user.uid}`;

      addDoc(collection(db, 'chatRooms', chatRoomId, 'messages'), {
        text: message,
        createdAt: new Date(),
        user: user.email,
      });
      setMessage('');
    }
  };

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await setDoc(doc(db, 'users', newUser.uid), {
        email: newUser.email,
        approved: false
      });

      alert("Kayıt Başarılı. Kayıt işleminiz başarılı. Hesabınız onaylandıktan sonra giriş yapabileceksiniz.");
      setUser(newUser);
      setIsSignUpMode(false);
    } catch (error) {
      console.error('Signup error:', error);
      alert("Hata. Kayıt sırasında bir hata oluştu.");
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;
      setUser(loggedInUser);
    } catch (error) {
      console.error('Login error:', error);
      alert("Hata. Giriş sırasında bir hata oluştu.");
    }
  };

  const handleUserClick = (user) => {
    setSelectedUserForOptions(user);
    setShowOptionsModal(true);
  };

  const handleOptionSelect = (option) => {
    if (option === 'Mesaj Gönder') {
      createChatRoom(selectedUserForOptions);
    } else if (option === 'Yaptığı İşler') {
      setShowWorksPage(true);
    }
    setShowOptionsModal(false);
  };

  const renderWorksPage = () => (
    <div className="works-page">
      <h2>{selectedUserForOptions.email} - Burak</h2>
      <button onClick={() => setShowWorksPage(false)}>Geri</button>
      <button onClick={() => { setShowWorksPage(false); setSelectedChatUser(null); }}>Anasayfa</button>
    </div>
  );

  if (!user) {
    return (
      <div className="auth-container">
        <p>Email:</p>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="input-field" 
        />
        <p>Password:</p>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="input-field" 
        />
        <button 
          onClick={isSignUpMode ? undefined : handleLogin} 
          disabled={isSignUpMode}
        >
          Login
        </button>
        <button 
          onClick={() => {
            setIsSignUpMode(true);
            handleSignUp();
          }}
        >
          Sign Up
        </button>
      </div>
    );
  }

  if (showWorksPage) {
    return renderWorksPage();
  }

  if (!selectedChatUser) {
    return (
      <div className="users-container">
        <h2>Kullanıcılar</h2>
        <ul>
          {users.map((item) => (
            <li key={item.uid} onClick={() => handleUserClick(item)} className="user-item">
              {item.email}
            </li>
          ))}
        </ul>
        <button onClick={() => signOut(auth).then(() => setUser(null))}>Çıkış Yap</button>

        {showOptionsModal && (
          <div className="modal">
            <p onClick={() => handleOptionSelect('Mesaj Gönder')} className="modal-option">Mesaj Gönder</p>
            <p onClick={() => handleOptionSelect('Yaptığı İşler')} className="modal-option">Yaptığı İşler</p>
            <button onClick={() => setShowOptionsModal(false)}>İptal</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="chat-container">
      <button onClick={() => setSelectedChatUser(null)}>Geri</button>
      <h2>{selectedChatUser.email} ile sohbet ediyorsunuz</h2>
      <ul>
        {messages.map((item) => (
          <li key={item.id} className="message-item">
            <strong>{item.user}:</strong> {item.text}
          </li>
        ))}
      </ul>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Mesaj yazın"
        className="input-field"
      />
      <button onClick={handleSendMessage}>Gönder</button>
      <button onClick={() => signOut(auth).then(() => setUser(null))}>Çıkış Yap</button>
    </div>
  );
};

export default App;
