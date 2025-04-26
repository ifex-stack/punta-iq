import React, { useState } from 'react';
import { RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Box,
  Text,
  ScrollView,
  VStack,
  HStack,
  Heading,
  Pressable,
  Badge,
  Icon,
  Avatar,
  Divider,
  Button,
  Center,
  useColorMode,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { usePredictions } from '../hooks/usePredictions';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

import PredictionCard from '../components/PredictionCard';
import SportsTabs from '../components/SportsTabs';
import AccumulatorPanel from '../components/AccumulatorPanel';
import SubscriptionBanner from '../components/SubscriptionBanner';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { subscriptionTier } = useSubscription();
  const { predictions, freePredictions, isPremium, isLoading, refetch } = usePredictions();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const [selectedSport, setSelectedSport] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredPredictions = selectedSport === 'all'
    ? predictions
    : predictions.filter(pred => pred.sport === selectedSport);

  const displayedPredictions = isPremium 
    ? filteredPredictions 
    : freePredictions;

  return (
    <Box flex={1} bg={isDark ? 'gray.900' : 'gray.50'} safeArea>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with greeting and notifications */}
        <HStack justifyContent="space-between" px={4} pt={4} pb={2} alignItems="center">
          <VStack>
            <Text fontSize="md" color={isDark ? 'gray.400' : 'gray.500'}>
              Welcome back,
            </Text>
            <Heading fontSize="xl">
              {user?.displayName || user?.username || 'Sports Fan'}
            </Heading>
          </VStack>
          <HStack space={2} alignItems="center">
            <Pressable onPress={() => navigation.navigate('Notifications')}>
              <Box position="relative">
                <Icon
                  as={Ionicons}
                  name="notifications-outline"
                  size={6}
                  color={isDark ? 'white' : 'gray.800'}
                />
                <Badge
                  colorScheme="danger"
                  rounded="full"
                  mb={-4}
                  mr={-1}
                  zIndex={1}
                  variant="solid"
                  alignSelf="flex-end"
                  _text={{ fontSize: 10 }}
                >
                  2
                </Badge>
              </Box>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Profile')}>
              <Avatar
                size="sm"
                source={{
                  uri: user?.photoURL || 'https://via.placeholder.com/150',
                }}
              >
                {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </Avatar>
            </Pressable>
          </HStack>
        </HStack>

        {/* Sports tabs */}
        <SportsTabs
          selectedSport={selectedSport}
          onSelectSport={setSelectedSport}
        />

        {/* Upgrade banner (if not premium) */}
        {!isPremium && (
          <SubscriptionBanner
            onPress={() => navigation.navigate('Subscription')}
          />
        )}

        {/* Today's predictions */}
        <VStack px={4} pt={4} pb={2}>
          <HStack justifyContent="space-between" alignItems="center">
            <Heading fontSize="lg">Today's Predictions</Heading>
            <Pressable onPress={() => navigation.navigate('Predictions')}>
              <HStack alignItems="center">
                <Text color="primary.500" fontWeight="semibold">
                  View All
                </Text>
                <Icon
                  as={Ionicons}
                  name="chevron-forward"
                  size={5}
                  color="primary.500"
                />
              </HStack>
            </Pressable>
          </HStack>
        </VStack>

        {/* Predictions list */}
        {isLoading ? (
          <Center flex={1} p={10}>
            <Text>Loading predictions...</Text>
          </Center>
        ) : displayedPredictions.length === 0 ? (
          <Center flex={1} p={10}>
            <Text textAlign="center" color={isDark ? 'gray.400' : 'gray.500'}>
              No predictions available for this sport today.
            </Text>
          </Center>
        ) : (
          <VStack space={4} px={4} pb={4}>
            {displayedPredictions.slice(0, 5).map((prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                onPress={() => navigation.navigate('PredictionDetail', { id: prediction.id })}
              />
            ))}
            {displayedPredictions.length > 5 && (
              <Button 
                variant="outline" 
                onPress={() => navigation.navigate('Predictions')}
              >
                See More Predictions
              </Button>
            )}
          </VStack>
        )}

        <Divider my={2} />

        {/* Accumulator panel */}
        <AccumulatorPanel
          onViewAll={() => navigation.navigate('Accumulator')}
        />
      </ScrollView>
    </Box>
  );
};

export default HomeScreen;