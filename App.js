import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

import { useState, useEffect } from 'react';
import {
  initializeDatabase,
  addBook,
  getBooks,
  updateBook,
  deleteBook,
  addBorrowing,
  getAvailableBooks,
} from './database';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>BorrowBook 📚</Text>
        <Text style={styles.subtitle}>
          Your Personal Book Lending Manager
        </Text>
      </View>

      <Text style={styles.welcome}>Welcome Back!</Text>
      <Text style={styles.description}>
        Keep track of your books and borrowers.
      </Text>

      <Text style={styles.sectionTitle}>My Book Summary</Text>

      <View style={styles.cardContainer}>
        {['Total Books', 'Available', 'Borrowed', 'Overdue'].map(
          (item) => (
            <View style={styles.card} key={item}>
              <Text style={styles.number}>0</Text>
              <Text style={styles.cardLabel}>{item}</Text>
            </View>
          )
        )}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <ActionButton
        title="📖 View My Books"
        onPress={() => navigation.navigate('My Books')}
      />

      <ActionButton
        title="➕ Add a New Book"
        onPress={() => navigation.navigate('Add Book')}
      />

      <ActionButton
        title="🤝 Lend a Book"
        onPress={() => navigation.navigate('Lend a Book')}
      />

      <ActionButton
        title="📋 Borrowing Records"
        onPress={() => navigation.navigate('Borrowing Records')}
      />
    </ScrollView>
  );
}

function ActionButton({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress}>
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
  );
}


function AddBookScreen() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [isbn, setIsbn] = useState('');

  
  async function handleSave() {
    if (!title.trim() || !author.trim() || !category.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter the title, author and category.'
      );
      return;
    }

    try {
      await addBook(
        title.trim(),
        author.trim(),
        category.trim(),
        isbn.trim()
      );

      Alert.alert('Success', 'Book saved successfully!');

      setTitle('');
      setAuthor('');
      setCategory('');
      setIsbn('');
    } catch (error) {
      Alert.alert('Error', 'Could not save the book.');
      console.log(error);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.formTitle}>Add a New Book 📚</Text>

      <Text style={styles.label}>Book Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter book title"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Author *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter author name"
        value={author}
        onChangeText={setAuthor}
      />

      <Text style={styles.label}>Category *</Text>
      <TextInput
        style={styles.input}
        placeholder="Example: Fiction, Education"
        value={category}
        onChangeText={setCategory}
      />

      <Text style={styles.label}>ISBN (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter ISBN"
        value={isbn}
        onChangeText={setIsbn}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Book</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


function MyBooksScreen({ navigation }) {
  const [books, setBooks] = useState([]);

  async function loadBooks() {
    try {
      const savedBooks = await getBooks();
      setBooks(savedBooks);
    } catch (error) {
      console.log('Error loading books:', error);
      Alert.alert('Error', 'Could not load books.');
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadBooks);

    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.formTitle}>My Books 📚</Text>

      {books.length === 0 ? (
        <Text style={styles.description}>
          No books added yet. Add your first book!
        </Text>
      ) : (
        books.map((book) => (
          <View style={styles.bookCard} key={book.id}>
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookInfo}>
              Author: {book.author}
            </Text>
            <Text style={styles.bookInfo}>
              Category: {book.category}
            </Text>
            <Text style={styles.bookInfo}>
              ISBN: {book.isbn || 'Not provided'}
            </Text>
            <Text style={styles.available}>Available</Text>

            <View style={styles.bookActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('Edit Book', { book })}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    'Delete Book',
                    `Are you sure you want to delete "${book.title}"?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteBook(book.id);
                          loadBooks();
                          Alert.alert('Success', 'Book deleted successfully!');
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => navigation.navigate('Add Book')}
      >
        <Text style={styles.saveButtonText}>+ Add Another Book</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


function EditBookScreen({ route, navigation }) {
  const { book } = route.params;

  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [category, setCategory] = useState(book.category);
  const [isbn, setIsbn] = useState(book.isbn || '');

  async function handleUpdate() {
    if (!title.trim() || !author.trim() || !category.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      await updateBook(
        book.id,
        title.trim(),
        author.trim(),
        category.trim(),
        isbn.trim()
      );

      Alert.alert('Success', 'Book updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Could not update the book.');
      console.log(error);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.formTitle}>Edit Book ✏️</Text>

      <Text style={styles.label}>Book Title *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter book title"
      />

      <Text style={styles.label}>Author *</Text>
      <TextInput
        style={styles.input}
        value={author}
        onChangeText={setAuthor}
        placeholder="Enter author name"
      />

      <Text style={styles.label}>Category *</Text>
      <TextInput
        style={styles.input}
        value={category}
        onChangeText={setCategory}
        placeholder="Enter category"
      />

      <Text style={styles.label}>ISBN</Text>
      <TextInput
        style={styles.input}
        value={isbn}
        onChangeText={setIsbn}
        placeholder="Enter ISBN (optional)"
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleUpdate}
      >
        <Text style={styles.saveButtonText}>Update Book</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


function LendBookScreen({ navigation }) {
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [borrowedDate, setBorrowedDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  async function loadAvailableBooks() {
    try {
      const availableBooks = await getAvailableBooks();
      setBooks(availableBooks);
    } catch (error) {
      console.log('Error loading available books:', error);
      Alert.alert('Error', 'Could not load available books.');
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener(
      'focus',
      loadAvailableBooks
    );

    return unsubscribe;
  }, [navigation]);

  async function handleLendBook() {
    if (
      !selectedBookId ||
      !borrowerName.trim() ||
      !borrowedDate.trim() ||
      !dueDate.trim()
    ) {
      Alert.alert('Missing Information', 'Please complete all required fields.');
      return;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(borrowedDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    ) {
      Alert.alert('Invalid Date', 'Enter dates in YYYY-MM-DD format.');
      return;
    }

    if (dueDate < borrowedDate) {
      Alert.alert('Invalid Date', 'Due date cannot be before borrowed date.');
      return;
    }

    try {
      await addBorrowing(
        selectedBookId,
        borrowerName.trim(),
        borrowerContact.trim(),
        borrowedDate,
        dueDate
      );

      Alert.alert('Success', 'Book lent successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.log('Error lending book:', error);
      Alert.alert('Error', 'Could not lend the book.');
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.formTitle}>Lend a Book 📖</Text>

      <Text style={styles.label}>Select a Book *</Text>

      {books.length === 0 ? (
        <Text style={styles.description}>
          No available books. Add a book first or return a borrowed book.
        </Text>
      ) : (
        books.map((book) => (
          <TouchableOpacity
            key={book.id}
            style={[
              styles.bookCard,
              selectedBookId === book.id && styles.selectedBook,
            ]}
            onPress={() => setSelectedBookId(book.id)}
          >
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookInfo}>Author: {book.author}</Text>
            <Text style={styles.bookInfo}>Category: {book.category}</Text>
            {selectedBookId === book.id && (
              <Text style={styles.available}>Selected ✓</Text>
            )}
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.label}>Borrower's Name *</Text>
      <TextInput
        style={styles.input}
        value={borrowerName}
        onChangeText={setBorrowerName}
        placeholder="Enter borrower's name"
      />

      <Text style={styles.label}>Contact Number</Text>
      <TextInput
        style={styles.input}
        value={borrowerContact}
        onChangeText={setBorrowerContact}
        placeholder="Enter contact number"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Borrowed Date * (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={borrowedDate}
        onChangeText={setBorrowedDate}
        placeholder="2026-11-11"
      />

      <Text style={styles.label}>Due Date * (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={dueDate}
        onChangeText={setDueDate}
        placeholder="2026-11-20"
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleLendBook}
      >
        <Text style={styles.saveButtonText}>Confirm Lending</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function OtherScreen({ route, navigation }) {
  return (
    <View style={styles.otherScreen}>
      <Text style={styles.otherTitle}>{route.name}</Text>
      <Text style={styles.description}>
        This screen will be developed in the next steps.
      </Text>

      <TouchableOpacity
        style={styles.action}
        onPress={() => navigation.navigate('Dashboard')}
      >
        <Text style={styles.actionText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  useEffect(() => {
    initializeDatabase()
      .then(() => console.log('Database ready!'))
      .catch(error => console.log('Database error:', error));
  }, []);
  return (
    <NavigationContainer>
      <StatusBar style="dark" />

      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerStyle: { backgroundColor: '#344E8C' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Dashboard" component={HomeScreen} />

        <Stack.Screen name="My Books" component={MyBooksScreen} />
        <Stack.Screen name="Edit Book" component={EditBookScreen} />
        <Stack.Screen name="Add Book" component={AddBookScreen} />
        <Stack.Screen name="Borrowing Records" component={OtherScreen} />
        <Stack.Screen name="Lend a Book" component={LendBookScreen} />
        <Stack.Screen name="Borrowing Details" component={OtherScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  header: {
    backgroundColor: '#344E8C',
    padding: 25,
    paddingTop: 35,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#E0E7FF',
    marginTop: 6,
    fontSize: 14,
  },
  welcome: {
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 25,
    marginHorizontal: 20,
    color: '#202A44',
  },
  description: {
    marginHorizontal: 20,
    marginTop: 8,
    color: '#666666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 12,
    color: '#202A44',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  number: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#344E8C',
  },
  cardLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  action: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#344E8C',
    fontWeight: '600',
  },
  otherScreen: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  otherTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#344E8C',
    marginBottom: 10,
  },

formTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#344E8C',
  margin: 20,
},
label: {
  fontSize: 16,
  fontWeight: '600',
  marginHorizontal: 20,
  marginTop: 15,
  color: '#202A44',
},
input: {
  backgroundColor: '#FFFFFF',
  marginHorizontal: 20,
  marginTop: 8,
  padding: 14,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#DDDDDD',
  fontSize: 16,
},
saveButton: {
  backgroundColor: '#344E8C',
  margin: 20,
  padding: 16,
  borderRadius: 10,
  alignItems: 'center',
},
saveButtonText: {
  color: '#FFFFFF',
  fontSize: 17,
  fontWeight: 'bold',
},

formTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#344E8C',
  margin: 20,
},
label: {
  fontSize: 16,
  fontWeight: '600',
  marginHorizontal: 20,
  marginTop: 15,
  color: '#202A44',
},
input: {
  backgroundColor: '#FFFFFF',
  marginHorizontal: 20,
  marginTop: 8,
  padding: 14,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#DDDDDD',
  fontSize: 16,
},
saveButton: {
  backgroundColor: '#344E8C',
  margin: 20,
  padding: 16,
  borderRadius: 10,
  alignItems: 'center',
},
saveButtonText: {
  color: '#FFFFFF',
  fontSize: 17,
  fontWeight: 'bold',
},

bookCard: {
  backgroundColor: '#FFFFFF',
  marginHorizontal: 20,
  marginBottom: 15,
  padding: 18,
  borderRadius: 12,
  elevation: 2,
},
bookCard: {
  backgroundColor: '#FFFFFF',
  marginHorizontal: 20,
  marginBottom: 15,
  padding: 18,
  borderRadius: 12,
  elevation: 2,
},

selectedBook: {
  borderWidth: 2,
  borderColor: '#344E8C',
  backgroundColor: '#EEF2FF',
},

bookTitle: {
  fontSize: 19,
  fontWeight: 'bold',
  color: '#344E8C',
  marginBottom: 8,
},
bookInfo: {
  fontSize: 14,
  color: '#555555',
  marginTop: 4,
},
available: {
  color: '#16834A',
  fontWeight: 'bold',
  marginTop: 10,
},

bookActions: {
  flexDirection: 'row',
  marginTop: 15,
  gap: 10,
},
editButton: {
  backgroundColor: '#344E8C',
  padding: 10,
  borderRadius: 8,
  flex: 1,
  alignItems: 'center',
},
deleteButton: {
  backgroundColor: '#D9534F',
  padding: 10,
  borderRadius: 8,
  flex: 1,
  alignItems: 'center',
},
actionButtonText: {
  color: '#FFFFFF',
  fontWeight: 'bold',
},

});
