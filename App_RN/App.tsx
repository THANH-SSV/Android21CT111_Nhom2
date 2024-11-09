import React, { useState, useEffect } from 'react';
import { NavigationContainer,useFocusEffect  } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import quizzesData from './data/quizzes.json';
import personalityData from './data/personality_types.json';

const Stack = createStackNavigator();

// Đường dẫn file JSON để lưu thông tin người dùng trong thư mục DocumentDirectory
//Vào View -> Tool Windows -> Device Explorer -> tìm theo đường dẫn:
// /data/data/com.app_rn/files/users.json
const filePath = `${RNFS.DocumentDirectoryPath}/users.json`;

// Hàm lưu người dùng vào file JSON
const saveUserToFile = async (user) => {
  try {
    const fileExists = await RNFS.exists(filePath);
    let users = [];

    if (fileExists) {
      const existingUsers = await RNFS.readFile(filePath, 'utf8');
      users = JSON.parse(existingUsers);
    }

    users.push({ ...user, progress: { MBTI: 0, DISC: 0 } });
    await RNFS.writeFile(filePath, JSON.stringify(users), 'utf8');
  } catch (error) {
    console.error("Lỗi khi lưu người dùng vào file", error);
  }
};

// Hàm lấy danh sách người dùng từ file JSON
const getUsersFromFile = async () => {
  try {
    const fileExists = await RNFS.exists(filePath);
    if (fileExists) {
      const users = await RNFS.readFile(filePath, 'utf8');
      return JSON.parse(users);
    }
    return [];
  } catch (error) {
    console.error("Lỗi khi đọc file người dùng", error);
    return [];
  }
};

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const loadRememberedUser = async () => {
      const rememberedUser = await AsyncStorage.getItem('rememberedUser');
      if (rememberedUser) {
        const user = JSON.parse(rememberedUser);
        setEmail(user.email);
        setPassword(user.password);
        navigation.navigate('Home');
      }
    };
    loadRememberedUser();
  }, []);

  const handleLogin = async () => {
    const users = await getUsersFromFile();
    const user = users.find(
      (u) => (u.email === email || u.username === email) && u.password === password
    );

    if (user) {
      user.progress = user.progress || { MBTI: 0, DISC: 0 };
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));

      if (rememberMe) {
        await AsyncStorage.setItem('rememberedUser', JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem('rememberedUser');
      }

      navigation.navigate('Home');
    } else {
      Alert.alert('Lỗi', 'Sai thông tin đăng nhập');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Username or email address"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <View style={styles.checkboxContainer}>
        <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={styles.checkbox}>
          {rememberMe && <View style={styles.checkedBox} />}
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>Remember Me</Text>
      </View>
      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>LOGIN</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.linkText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('UserList')}>
        <Text style={styles.linkText}>View Registered Users</Text>
      </TouchableOpacity>
    </View>
  );
};

const SignupScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async () => {
    if (password === confirmPassword) {
      await saveUserToFile({ username, email, password });
      Alert.alert('Thành công', 'Đăng ký thành công');
      navigation.navigate('Login');
    } else {
      Alert.alert('Lỗi', 'Mật khẩu không khớp');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        placeholder="Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        placeholder="Repeat Password"
        placeholderTextColor="#888"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />
      <TouchableOpacity onPress={handleSignup} style={styles.button}>
        <Text style={styles.buttonText}>SIGN UP</Text>
      </TouchableOpacity>
    </View>
  );
};

const UserListScreen = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await getUsersFromFile();
      setUsers(users);
    };
    fetchUsers();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registered Users</Text>

      {/* Header Row */}
      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>Username</Text>
        <Text style={styles.headerCell}>Email</Text>
        <Text style={styles.headerCell}>MBTI</Text>
        <Text style={styles.headerCell}>DISC</Text>
      </View>

      {/* User List */}
      <FlatList
        data={users}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={styles.cell}>{item.username}</Text>
            <Text style={styles.cell}>{item.email}</Text>
            <Text style={styles.cell}>{item.MBTI_personalityType || "-"}</Text>
            <Text style={styles.cell}>{item.DISC_personalityType || "-"}</Text>
          </View>
        )}
      />
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const [progress, setProgress] = useState({ MBTI: 0, DISC: 0 });

  useFocusEffect(
    React.useCallback(() => {
      const loadUserProgress = async () => {
        try {
          const userData = await AsyncStorage.getItem('currentUser');
          const user = userData ? JSON.parse(userData) : null;

          if (user && user.progress) {
            setProgress(user.progress);
          } else {
            setProgress({ MBTI: 0, DISC: 0 }); // Default progress if undefined
          }
        } catch (error) {
          console.error("Error loading user-specific progress", error);
        }
      };
      loadUserProgress();
    }, [])
  );

  const renderQuizItem = ({ item }) => {
    const quizProgress = progress[item.id === 1 ? 'MBTI' : 'DISC'] * 100;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Quiz', { quizId: item.id, progress })}
        style={styles.quizItem}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.quizImage} />
        <View style={styles.quizInfo}>
          <Text style={styles.quizTitle}>{item.name}</Text>
          <Text style={styles.quizDescription}>{item.description}</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${quizProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(quizProgress)}%</Text>
        </View>
      </TouchableOpacity>
    );
  };


  const quizzes = [
    {
      id: 1,
      name: 'MBTI',
      description: 'Myers-Briggs Type Indicator',
      imageUrl: 'https://i0.wp.com/sheseeksnonfiction.blog/wp-content/uploads/2021/02/16personalities.jpg?resize=262%2C262&ssl=1',
    },
    {
      id: 2,
      name: 'DISC',
      description: 'Dominance, Influence, Steadiness, Compliance',
      imageUrl: 'https://s3.kstorage.vn/api-kdata/images/posts/65b75d135f43b.png',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Available Quizzes</Text>
      <FlatList
        data={quizzes}
        renderItem={renderQuizItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};


const QuizScreen = ({ route, navigation }) => {
  const { quizId, progress: initialProgress } = route.params;
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]); // Initialize as an array
    const [progress, setProgress] = useState(initialProgress[quizId === 1 ? 'MBTI' : 'DISC']);
    const [currentUser, setCurrentUser] = useState(null);

    const quizType = quizId === 1 ? 'MBTI' : 'DISC';
    const questions = quizzesData[quizType];

  useEffect(() => {
      const loadCurrentUser = async () => {
        try {
          const userData = await AsyncStorage.getItem('currentUser');
          if (userData) {
            const user = JSON.parse(userData);
            setCurrentUser(user);
            loadAnswersFromStorage(user);
          }
        } catch (error) {
          console.error("Error loading current user", error);
        }
      };
      loadCurrentUser();
    }, []);

   const saveUserProgressAndType = async (newProgress, personalityType) => {
       try {
         if (currentUser) {
           // Update both progress and personalityType for the user
           currentUser.progress[quizType] = newProgress;
           currentUser[`${quizType}_personalityType`] = personalityType;
           await AsyncStorage.setItem('currentUser', JSON.stringify(currentUser));

           // Update users.json with the new data
           const users = await getUsersFromFile();
           const updatedUsers = users.map((u) => (u.email === currentUser.email ? currentUser : u));
           await RNFS.writeFile(filePath, JSON.stringify(updatedUsers), 'utf8');
         }
       } catch (error) {
         console.error("Error saving user-specific progress and type", error);
       }
     };

  const handleNext = () => {
      if (!answers[questionIndex]) {
        Alert.alert("Please answer the question", "You must select an answer before proceeding.");
        return;
      }
      if (questionIndex < questions.length - 1) {
        const newProgress = (questionIndex + 1) / questions.length;
        setProgress(newProgress);
        saveUserProgressAndType(newProgress, null);
        setQuestionIndex(questionIndex + 1);
      }
    };

  const handleBack = () => {
      if (questionIndex > 0) {
        setQuestionIndex(questionIndex - 1);
      }
    };

  const calculatePersonalityType = (answers, quizType) => {
    if (quizType === "MBTI") {
      // MBTI calculation (as previously implemented)
      let I_E = 0;
      let N_S = 0;
      let T_F = 0;
      let J_P = 0;

      answers.forEach((answer, index) => {
        if ([0, 3, 8, 11, 15, 18].includes(index)) {
          I_E += answer === "Có" ? 1 : -1;
        } else if ([1, 4, 7, 10, 14, 17].includes(index)) {
          N_S += answer === "Có" ? 1 : -1;
        } else if ([2, 5, 9, 12, 16, 19].includes(index)) {
          T_F += answer === "Cảm xúc" || answer === "Có" ? 1 : -1;
        } else if ([6, 13, 20].includes(index)) {
          J_P += answer === "Có tổ chức" || answer === "Có" ? 1 : -1;
        }
      });

      const IorE = I_E >= 0 ? "I" : "E";
      const NorS = N_S >= 0 ? "N" : "S";
      const TorF = T_F >= 0 ? "T" : "F";
      const JorP = J_P >= 0 ? "J" : "P";
      return `${IorE}${NorS}${TorF}${JorP}`;
    } else if (quizType === "DISC") {
      // Manual DISC calculation
      let D = 0;
      let I = 0;
      let S = 0;
      let C = 0;

      answers.forEach((answer, index) => {
        // Each condition corresponds to how each question's answer affects each type
        if (index === 0 || index === 4 || index === 8 || index === 12 || index === 16) {
          // Dominance type questions
          if (answer === "Có") {
            D += 2;
          } else if (answer === "Không") {
            S += 1; // Answering "Không" may indicate higher steadiness
          }
        } else if (index === 1 || index === 5 || index === 9 || index === 13 || index === 17) {
          // Influence type questions
          if (answer === "Có") {
            I += 2;
          } else if (answer === "Không") {
            C += 1; // Answering "Không" may indicate higher compliance
          }
        } else if (index === 2 || index === 6 || index === 10 || index === 14 || index === 18) {
          // Steadiness type questions
          if (answer === "Có") {
            S += 2;
          } else if (answer === "Không") {
            D += 1; // Answering "Không" could indicate Dominance
          }
        } else if (index === 3 || index === 7 || index === 11 || index === 15 || index === 19) {
          // Compliance type questions
          if (answer === "Có") {
            C += 2;
          } else if (answer === "Không") {
            I += 1; // Answering "Không" could indicate Influence
          }
        }
      });

      // Determine DISC type based on highest scores
      if (D >= I && D >= S && D >= C) {
        return "D"; // Dominance
      } else if (I >= D && I >= S && I >= C) {
        return "I"; // Influence
      } else if (S >= D && S >= I && S >= C) {
        return "S"; // Steadiness
      } else if (C >= D && C >= I && C >= S) {
        return "C"; // Compliance
      }

      // If two or more traits are tied, combine letters (e.g., "DI" for Dominance and Influence)
      let discType = "";
      if (D === Math.max(D, I, S, C)) discType += "D";
      if (I === Math.max(D, I, S, C)) discType += "I";
      if (S === Math.max(D, I, S, C)) discType += "S";
      if (C === Math.max(D, I, S, C)) discType += "C";

      return discType;
    }
  };




  const handleSubmit = () => {
      if (!answers[questionIndex]) {
        Alert.alert("Please answer the question", "You must select an answer before submitting.");
        return;
      }
      const personalityType = calculatePersonalityType(answers, quizType);
      saveUserProgressAndType(1, personalityType); // Save completed progress and calculated type
      navigation.navigate("Result", { quizId, personalityType });
    };


  const saveAnswersToStorage = async (user, answers) => {
    try {
      const key = `quizAnswers_${user.email || user.username}_${quizType}`;
      await AsyncStorage.setItem(key, JSON.stringify(answers));
    } catch (error) {
      console.error("Error saving answers to storage", error);
    }
  };

  const loadAnswersFromStorage = async (user) => {
    try {
      const key = `quizAnswers_${user.email || user.username}_${quizType}`;
      const savedAnswers = await AsyncStorage.getItem(key);
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers)); // Load saved answers
      }
    } catch (error) {
      console.error("Error loading answers from storage", error);
    }
  };

   const selectAnswer = (option) => {
     // Ensure answers is an array, or initialize it as an empty array
     const currentAnswers = Array.isArray(answers) ? answers : [];
     const newAnswers = [...currentAnswers];
     newAnswers[questionIndex] = option;
     setAnswers(newAnswers);

     if (currentUser) {
       saveAnswersToStorage(currentUser, newAnswers);
     }
   };

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Question {questionIndex + 1}</Text>
        <Text style={styles.question}>{questions[questionIndex].question}</Text>
        {questions[questionIndex].options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => selectAnswer(option)}
            style={styles.optionContainer}
          >
            <View style={styles.radioButton}>
              {answers[questionIndex] === option && <View style={styles.radioButtonSelected} />}
            </View>
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        <View style={styles.navigationButtons}>
          {questionIndex > 0 && (
            <TouchableOpacity onPress={handleBack} style={styles.navButton}>
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          {questionIndex < questions.length - 1 ? (
            <TouchableOpacity onPress={handleNext} style={styles.navButton}>
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
              <Text style={styles.navButtonText}>Submit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
};



const ResultScreen = ({ route, navigation }) => {
  const { quizId, personalityType } = route.params;
  const quizType = quizId === 1 ? 'MBTI' : 'DISC';

  // Lấy dữ liệu loại tính cách từ file JSON
  const result = personalityData[quizType][personalityType];

  return (
      <View style={styles.resultContainer}>
        {result && result.imageUrl ? (
          <Image
            source={{ uri: result.imageUrl }} // Display specific image for the personality type
            style={styles.resultImage}
          />
        ) : (
          <Text>No Image Available</Text>
        )}
        <Text style={styles.resultTitle}>Kết Quả Tính Cách Của Bạn</Text>
        {result ? (
          <>
            <Text style={styles.resultText}>{`${result.name} - ${personalityType}`}</Text>
            <Text style={styles.resultDescription}>{result.description}</Text>
          </>
        ) : (
          <Text style={styles.resultDescription}>
            Loại tính cách không xác định. Vui lòng thử lại.
          </Text>
        )}
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    );
 };


const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="UserList" component={UserListScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#007BFF',
      padding: 10,
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
    },
    headerCell: {
      flex: 1,
      color: '#FFFFFF',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
    },
    cell: {
      flex: 1,
      textAlign: 'center',
      fontSize: 10,
    },
  input: {
    width: '80%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    color: "#000"
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#007BFF',
    marginTop: 15,
  },
  checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 1,
      borderColor: '#007BFF',
      marginRight: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkedBox: {
      width: 12,
      height: 12,
      backgroundColor: '#007BFF',
    },
    checkboxLabel: {
      fontSize: 16,
      color: '#555',
    },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  quizItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  quizImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  quizInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizDescription: {
    color: '#555',
    marginBottom: 5,
  },
  progressContainer: {
      width: '100%', // Đảm bảo chiều rộng cố định cho container
      height: 10,
      backgroundColor: '#E0E0E0',
      borderRadius: 5,
      overflow: 'hidden',
      marginVertical: 10,
      flexDirection: 'row', // Giúp căn giữa progressText với thanh tiến độ
      alignItems: 'center',
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#007BFF',
      borderRadius: 5,
    },
    progressText: {
      marginLeft: 10, // Đặt khoảng cách bên trái để tách biệt progressText
      fontSize: 15,
      color: '#555',
    },
  userItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '80%',
  },
  question: {
      fontSize: 18,
      marginBottom: 10,
    },
    optionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    radioButton: {
      height: 20,
      width: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#007BFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    radioButtonSelected: {
      height: 10,
      width: 10,
      borderRadius: 5,
      backgroundColor: '#007BFF',
    },
    optionText: {
      fontSize: 16,
    },
    navigationButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    navButton: {
      backgroundColor: '#007BFF',
      padding: 10,
      borderRadius: 5,
      width: '45%',
      alignItems: 'center',
    },
    navButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    submitButton: {
      backgroundColor: '#FFD700', // Yellow background for "Submit" button
      padding: 10,
      borderRadius: 5,
      width: '45%',
      alignItems: 'center',
    },
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFF',
      },
      resultImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
        marginBottom: 20,
      },
      resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
      },
      resultText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
      },
      resultDescription: {
        fontSize: 14,
        textAlign: 'center',
        color: '#666',
        marginBottom: 20,
      },
      closeButton: {
        backgroundColor: '#FF5C5C',
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 20,
      },
      closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
      },
});

export default App;
