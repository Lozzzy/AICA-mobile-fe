import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Alert,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';
import CustomAlertModal from '../components/CustomAlertModal';

interface UserInfo {
    id: number;
    userId: string;
    email: string;
    nickname: string;
}

interface WordData {
    wordId: number;
}

const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

export default function MyPageScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [wordCount, setWordCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [memberResponse, wordResponse] = await Promise.all([
                api.get('/api/member'),
                api.get('/api/word'),
            ]);
            
            setUserInfo(memberResponse.data);

            const allWords: WordData[] = wordResponse.data.data;

            const uniqueWords = allWords.filter((word, index, self) =>
                index === self.findIndex(w => w.wordId === word.wordId)
            );

            setWordCount(uniqueWords.length);

        } catch (error) {
            console.error("데이터를 불러오는데 실패했습니다.", error);
            Alert.alert("오류", "정보를 가져오는 중 문제가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLogoutPress = () => {
        setIsLogoutModalVisible(true);
    };

    const confirmLogout = async () => {
        setIsLogoutModalVisible(false);
        try {
            await Promise.all([
                SecureStore.deleteItemAsync('accessToken'),
                SecureStore.deleteItemAsync('refreshToken'),
            ]);
            router.replace('/main');
        } catch (error) {
            console.error("로그아웃 처리 중 오류 발생", error);
            Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
        }
    };

    const cancelLogout = () => {
        setIsLogoutModalVisible(false);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000000" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="black" />
                    </TouchableOpacity>
                </View>

                <View style={styles.profileSection}>
                    <Image
                        source={require('../assets/images/aica-character.png')}
                        style={styles.profileImage}
                    />
                    <Text style={styles.nickname}>{userInfo?.nickname}</Text>
                </View>

                <View style={styles.infoSection}>
                    <InfoRow label="ID" value={userInfo?.userId ?? ''} />
                    <InfoRow label="E-mail" value={userInfo?.email ?? ''} />
                    <InfoRow label="저장된 단어 개수" value={wordCount} />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
                    <Text style={styles.logoutText}>로그아웃</Text>
                </TouchableOpacity>
            </ScrollView>

            <CustomAlertModal
                isVisible={isLogoutModalVisible}
                title="로그아웃"
                message="정말 로그아웃 하시겠습니까?"
                onConfirm={confirmLogout}
                onCancel={cancelLogout}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingVertical: 10,
    },
    backButton: {
        padding: 5,
    },
    profileSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
    },
    nickname: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    infoSection: {
        marginBottom: 40,
    },
    infoRow: {
        marginBottom: 20,
    },
    infoLabel: {
        fontSize: 14,
        color: '#8A8A8A',
        marginBottom: 8,
    },
    infoValue: {
        fontSize: 16,
        color: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEA',
        paddingBottom: 8,
    },
    logoutButton: {
        marginTop: 60,
    },
    logoutText: {
        fontSize: 16,
        color: '#444444',
        textAlign: 'center',
    },
});