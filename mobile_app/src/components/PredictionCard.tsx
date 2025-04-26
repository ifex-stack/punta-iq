import React, { useMemo } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Pressable,
  Icon,
  useColorMode,
  IPressableProps,
} from 'native-base';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

type PredictionCardProps = IPressableProps & {
  prediction: any;
  showConfidence?: boolean;
  compact?: boolean;
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'confidence.high';
  if (confidence >= 60) return 'confidence.medium';
  return 'confidence.low';
};

const getSportIcon = (sport: string) => {
  switch (sport.toLowerCase()) {
    case 'football':
      return <MaterialCommunityIcons name="soccer" size={20} />;
    case 'basketball':
      return <MaterialCommunityIcons name="basketball" size={20} />;
    case 'tennis':
      return <MaterialCommunityIcons name="tennis" size={20} />;
    case 'baseball':
      return <MaterialCommunityIcons name="baseball" size={20} />;
    case 'hockey':
      return <MaterialCommunityIcons name="hockey-sticks" size={20} />;
    default:
      return <MaterialCommunityIcons name="trophy-outline" size={20} />;
  }
};

const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  showConfidence = true,
  compact = false,
  ...props
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const {
    id,
    sport,
    league,
    homeTeam,
    awayTeam,
    startTime,
    predictions,
    isPremium,
  } = prediction;

  const mainPrediction = predictions?.['1X2'] || predictions?.['Match Result'] || {};
  const { predicted_outcome, confidence } = mainPrediction;
  
  const formattedTime = useMemo(() => {
    if (!startTime) return '';
    try {
      return formatDistanceToNow(new Date(startTime), { addSuffix: true });
    } catch (e) {
      return startTime;
    }
  }, [startTime]);

  const confidenceColor = getConfidenceColor(confidence);

  return (
    <Pressable
      {...props}
      overflow="hidden"
      rounded="lg"
      bg={isDark ? 'gray.800' : 'white'}
      borderWidth={1}
      borderColor={isDark ? 'gray.700' : 'gray.200'}
      shadow={2}
    >
      <Box p={compact ? 3 : 4}>
        {/* Card Header */}
        <HStack justifyContent="space-between" alignItems="center" mb={2}>
          <HStack space={2} alignItems="center">
            <Box color={isDark ? 'white' : 'gray.800'}>
              {getSportIcon(sport)}
            </Box>
            <Text fontSize="xs" color="gray.500" fontWeight="medium">
              {league}
            </Text>
          </HStack>
          <HStack space={1}>
            <Text fontSize="xs" color="gray.500">
              {formattedTime}
            </Text>
            {isPremium && (
              <Badge colorScheme="purple" variant="subtle" rounded="sm">
                PRO
              </Badge>
            )}
          </HStack>
        </HStack>

        {/* Teams */}
        <HStack justifyContent="space-between" alignItems="center" mb={3}>
          <VStack flex={1}>
            <Text
              fontSize={compact ? 'sm' : 'md'}
              fontWeight="bold"
              color={isDark ? 'white' : 'gray.800'}
              isTruncated
            >
              {homeTeam}
            </Text>
            <Text
              fontSize={compact ? 'sm' : 'md'}
              fontWeight="bold"
              color={isDark ? 'white' : 'gray.800'}
              isTruncated
            >
              {awayTeam}
            </Text>
          </VStack>

          {/* Prediction Result */}
          {predicted_outcome && (
            <Box
              bg={confidenceColor}
              px={3}
              py={2}
              rounded="md"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="white" fontWeight="bold" fontSize={compact ? 'sm' : 'md'}>
                {predicted_outcome}
              </Text>
              {showConfidence && (
                <Text color="white" fontSize="xs">
                  {confidence}% confidence
                </Text>
              )}
            </Box>
          )}
        </HStack>

        {/* Additional info */}
        {!compact && (
          <HStack justifyContent="space-between" alignItems="center">
            <HStack space={1} alignItems="center">
              <Icon
                as={Ionicons}
                name="stats-chart-outline"
                size={4}
                color="gray.500"
              />
              <Text fontSize="xs" color="gray.500">
                {Object.keys(predictions || {}).length} markets
              </Text>
            </HStack>
            <HStack space={1} alignItems="center">
              <Text fontSize="xs" color="primary.500" fontWeight="medium">
                View Details
              </Text>
              <Icon
                as={Ionicons}
                name="chevron-forward"
                size={4}
                color="primary.500"
              />
            </HStack>
          </HStack>
        )}
      </Box>
    </Pressable>
  );
};

export default PredictionCard;