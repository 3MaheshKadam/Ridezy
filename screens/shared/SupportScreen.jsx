import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const SupportScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Mock user role - in real app, get from context/AsyncStorage
  const userRole = 'carOwner'; // carOwner, driver, carWashCenter, admin

  // Support categories
  const supportCategories = [
    { id: 'general', name: 'General Help', icon: 'help-circle', color: '#3B82F6' },
    { id: 'bookings', name: 'Bookings', icon: 'calendar', color: '#00C851' },
    { id: 'payments', name: 'Payments', icon: 'card', color: '#F59E0B' },
    { id: 'account', name: 'Account', icon: 'person', color: '#8B5CF6' },
    { id: 'technical', name: 'Technical', icon: 'settings', color: '#6C757D' },
  ];

  // Quick actions
  const quickActions = [
    {
      id: 'live_chat',
      title: 'Live Chat',
      subtitle: 'Chat with our support team',
      icon: 'chatbubbles',
      iconBg: '#00C851',
      onPress: () => openChatModal(),
    },
    {
      id: 'call_support',
      title: 'Call Support',
      subtitle: '24/7 helpline available',
      icon: 'call',
      iconBg: '#3B82F6',
      onPress: () => handleCallSupport(),
    },
    {
      id: 'email_support',
      title: 'Email Support',
      subtitle: 'Get detailed assistance',
      icon: 'mail',
      iconBg: '#F59E0B',
      onPress: () => handleEmailSupport(),
    },
    {
      id: 'emergency',
      title: 'Emergency',
      subtitle: 'Urgent assistance needed',
      icon: 'warning',
      iconBg: '#dc2626',
      onPress: () => handleEmergency(),
    },
  ];

  // FAQ data by category
  const faqData = {
    general: [
      {
        id: '1',
        question: 'How do I create an account on Ridezy?',
        answer: 'You can create an account by downloading the Ridezy app and tapping "Sign Up". You\'ll need to provide your email, phone number, and choose your role (Car Owner, Driver, or Car Wash Center).',
      },
      {
        id: '2',
        question: 'Is Ridezy available in my city?',
        answer: 'Ridezy is currently available in major cities across Maharashtra. We\'re expanding rapidly to other states. Check the app for availability in your area.',
      },
      {
        id: '3',
        question: 'How do I contact customer support?',
        answer: 'You can reach us through live chat, call our 24/7 helpline at +91 1800-RIDEZY, or email us at support@ridezy.in.',
      },
    ],
    bookings: [
      {
        id: '4',
        question: 'How do I book a car wash service?',
        answer: 'Open the app, select "Car Wash", choose your preferred center, select service type, pick a time slot, and confirm booking with payment.',
      },
      {
        id: '5',
        question: 'Can I cancel or reschedule my booking?',
        answer: 'Yes, you can cancel or reschedule up to 2 hours before your appointment time. Go to "My Bookings" and select the booking to modify.',
      },
      {
        id: '6',
        question: 'What if the service provider doesn\'t show up?',
        answer: 'If your service provider doesn\'t arrive within 15 minutes of the scheduled time, contact support immediately for a full refund or rescheduling.',
      },
    ],
    payments: [
      {
        id: '7',
        question: 'What payment methods do you accept?',
        answer: 'We accept UPI, credit/debit cards, net banking, and digital wallets. Cash payments are available for driver services.',
      },
      {
        id: '8',
        question: 'How do refunds work?',
        answer: 'Refunds are processed within 3-5 business days to your original payment method. Cancellation charges may apply based on timing.',
      },
      {
        id: '9',
        question: 'Is my payment information secure?',
        answer: 'Yes, we use bank-level encryption and comply with PCI DSS standards. Your payment information is never stored on our servers.',
      },
    ],
    account: [
      {
        id: '10',
        question: 'How do I update my profile information?',
        answer: 'Go to "Profile" in the app menu, tap "Edit", make your changes, and save. Some changes may require verification.',
      },
      {
        id: '11',
        question: 'Can I have multiple roles on one account?',
        answer: 'Yes, you can be both a Car Owner and Driver. You can add the Driver role from your profile settings after document verification.',
      },
      {
        id: '12',
        question: 'How do I delete my account?',
        answer: 'Go to Profile > Settings > Delete Account. Note that this action is permanent and cannot be undone.',
      },
    ],
    technical: [
      {
        id: '13',
        question: 'The app is running slowly. What should I do?',
        answer: 'Try closing and reopening the app, ensure you have a stable internet connection, and make sure you\'re using the latest version.',
      },
      {
        id: '14',
        question: 'I\'m not receiving notifications. How to fix this?',
        answer: 'Check your device notification settings, ensure Ridezy has notification permissions, and verify notification preferences in the app.',
      },
      {
        id: '15',
        question: 'How do I report a bug or technical issue?',
        answer: 'Use the "Report Issue" feature in Settings, or contact support with details about the problem and your device information.',
      },
    ],
  };

  // Help articles
  const helpArticles = [
    {
      id: '1',
      title: 'Getting Started with Ridezy',
      excerpt: 'Complete guide to setting up your account and booking your first service',
      category: 'general',
      readTime: '5 min',
    },
    {
      id: '2',
      title: 'Car Wash Service Guide',
      excerpt: 'Everything you need to know about our car wash services and booking process',
      category: 'bookings',
      readTime: '3 min',
    },
    {
      id: '3',
      title: 'Becoming a Ridezy Driver',
      excerpt: 'Step-by-step guide to register as a driver and start earning',
      category: 'account',
      readTime: '7 min',
    },
    {
      id: '4',
      title: 'Payment and Pricing Guide',
      excerpt: 'Understanding our pricing structure and payment options',
      category: 'payments',
      readTime: '4 min',
    },
  ];

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const openChatModal = () => {
    setShowChatModal(true);
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeChatModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowChatModal(false);
      setChatMessage('');
    });
  };

  const handleCallSupport = () => {
    Alert.alert(
      'Call Support',
      'Choose your preferred contact method:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => Linking.openURL('tel:+911800RIDEZY') },
        { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/911800RIDEZY') },
      ]
    );
  };

  const handleEmailSupport = () => {
    const subject = `Support Request - ${userRole}`;
    const body = 'Please describe your issue here...';
    Linking.openURL(`mailto:support@ridezy.in?subject=${subject}&body=${body}`);
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Support',
      'This is for urgent situations only. What type of emergency?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Safety Issue', onPress: () => Alert.alert('Emergency', 'Connecting to emergency support...') },
        { text: 'Service Issue', onPress: () => Alert.alert('Emergency', 'Connecting to priority support...') },
      ]
    );
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    // TODO: Implement actual chat functionality
    Alert.alert('Message Sent', 'Our support team will respond shortly.');
    setChatMessage('');
    closeChatModal();
  };

  const toggleFAQ = (faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const getFilteredFAQs = () => {
    const faqs = faqData[selectedCategory] || [];
    if (!searchQuery) return faqs;
    
    return faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredArticles = () => {
    if (!searchQuery) return helpArticles;
    
    return helpArticles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Custom Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="bg-white pt-12 pb-4 px-6 shadow-sm shadow-black/5"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#1A1B23" />
          </TouchableOpacity>
          
          <View className="flex-1 items-center">
            <Text className="text-primary text-lg font-semibold">Help & Support</Text>
          </View>
          
          <TouchableOpacity
            onPress={() => Alert.alert('Report Issue', 'Issue reporting form will be shown here')}
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="bug" size={20} color="#1A1B23" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-4"
        >
          <View className="rounded-2xl overflow-hidden">
            <LinearGradient
              colors={['#00C851', '#00A843']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 20,
              }}
            >
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold mb-2">
                    How can we help you?
                  </Text>
                  <Text className="text-white/80 text-sm">
                    We're here 24/7 to assist with any questions or issues
                  </Text>
                </View>
                <View className="w-16 h-16 bg-white/20 rounded-2xl justify-center items-center">
                  <Ionicons name="help-circle" size={32} color="#ffffff" />
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Get Help Now
          </Text>
          
          <View className="flex-row flex-wrap gap-3">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={action.onPress}
                activeOpacity={0.8}
                className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100 items-center"
                style={{ width: (width - 60) / 2 }}
              >
                <View 
                  className="w-12 h-12 rounded-2xl justify-center items-center mb-3"
                  style={{ backgroundColor: action.iconBg + '20' }}
                >
                  <Ionicons name={action.icon} size={24} color={action.iconBg} />
                </View>
                <Text className="text-primary text-base font-semibold text-center mb-1">
                  {action.title}
                </Text>
                <Text className="text-secondary text-sm text-center">
                  {action.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-4 mt-6"
        >
          <View className="bg-white rounded-2xl border-2 border-gray-100 flex-row items-center px-4 py-3">
            <Ionicons name="search" size={20} color="#6C757D" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for help articles or FAQs..."
              placeholderTextColor="#6C757D"
              className="flex-1 ml-3 text-primary text-base"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#6C757D" />
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>

        {/* Categories */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-4 mt-6"
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3">
              {supportCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className={`flex-row items-center px-4 py-3 rounded-2xl ${
                    selectedCategory === category.id
                      ? 'bg-accent'
                      : 'bg-white border border-gray-200'
                  } shadow-sm shadow-black/5`}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={category.icon}
                    size={16}
                    color={selectedCategory === category.id ? '#ffffff' : category.color}
                  />
                  <Text className={`ml-2 text-sm font-medium ${
                    selectedCategory === category.id ? 'text-white' : 'text-secondary'
                  }`}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Help Articles */}
        {!searchQuery || getFilteredArticles().length > 0 ? (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }}
            className="px-4 mt-6"
          >
            <Text className="text-primary text-lg font-bold mb-4">
              Help Articles
            </Text>
            
            {getFilteredArticles().map((article) => (
              <TouchableOpacity
                key={article.id}
                onPress={() => Alert.alert('Article', `Opening: ${article.title}`)}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-black/5 border border-gray-100"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-primary text-base font-semibold mb-2">
                      {article.title}
                    </Text>
                    <Text className="text-secondary text-sm mb-2">
                      {article.excerpt}
                    </Text>
                    <View className="flex-row items-center">
                      <View className="bg-gray-100 px-2 py-1 rounded-full mr-2">
                        <Text className="text-secondary text-xs">
                          {article.category}
                        </Text>
                      </View>
                      <Text className="text-secondary text-xs">
                        {article.readTime} read
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6C757D" />
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        ) : null}

        {/* FAQs */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-4 mt-6 mb-8"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Frequently Asked Questions
          </Text>
          
          {getFilteredFAQs().length > 0 ? (
            getFilteredFAQs().map((faq) => (
              <TouchableOpacity
                key={faq.id}
                onPress={() => toggleFAQ(faq.id)}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-black/5 border border-gray-100"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-primary text-base font-semibold flex-1 pr-4">
                    {faq.question}
                  </Text>
                  <Ionicons 
                    name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6C757D" 
                  />
                </View>
                
                {expandedFAQ === faq.id && (
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-secondary text-sm leading-6">
                      {faq.answer}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View className="bg-white rounded-2xl p-8 shadow-sm shadow-black/5 border border-gray-100 items-center">
              <Ionicons name="search" size={32} color="#6C757D" />
              <Text className="text-primary text-base font-semibold mt-4 mb-2">
                No results found
              </Text>
              <Text className="text-secondary text-sm text-center">
                Try searching with different keywords or browse other categories
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Live Chat Modal */}
      <Modal
        visible={showChatModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeChatModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View
            style={{
              transform: [{ translateY: modalSlideAnim }],
            }}
            className="bg-white rounded-t-3xl p-6 max-h-[80%]"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <Text className="text-primary text-xl font-bold">
                Live Chat Support
              </Text>
              <Text className="text-secondary text-sm">
                Our support team is online and ready to help
              </Text>
            </View>

            {/* Chat Interface Placeholder */}
            <View className="flex-1 mb-6">
              <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                <View className="flex-row items-start">
                  <View className="w-8 h-8 bg-accent rounded-full justify-center items-center mr-3">
                    <Ionicons name="person" size={16} color="#ffffff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-primary text-sm font-semibold mb-1">
                      Support Agent
                    </Text>
                    <Text className="text-secondary text-sm">
                      Hi! I'm here to help. What can I assist you with today?
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Message Input */}
            <View className="bg-gray-50 rounded-2xl p-4 mb-4 flex-row items-center">
              <TextInput
                value={chatMessage}
                onChangeText={setChatMessage}
                placeholder="Type your message here..."
                placeholderTextColor="#6C757D"
                multiline
                className="flex-1 text-primary text-base"
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!chatMessage.trim()}
                className={`ml-3 w-10 h-10 rounded-full justify-center items-center ${
                  chatMessage.trim() ? 'bg-accent' : 'bg-gray-300'
                }`}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="send" 
                  size={16} 
                  color={chatMessage.trim() ? "#ffffff" : "#6C757D"} 
                />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={closeChatModal}
                className="flex-1 bg-gray-200 rounded-2xl py-4 justify-center items-center"
                activeOpacity={0.8}
              >
                <Text className="text-primary text-base font-semibold">
                  Close
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  closeChatModal();
                  handleCallSupport();
                }}
                className="flex-1 rounded-2xl overflow-hidden"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="call" size={16} color="#ffffff" />
                    <Text className="text-white text-base font-semibold ml-2">
                      Call Instead
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default SupportScreen;