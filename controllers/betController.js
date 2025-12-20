const Bet = require('../models/Bet');
const Event = require('../models/Event');
const response = require('../utils/responseHandler');
const { calculatePotentialWin } = require('../services/betService');

/**
 * @route   POST /bets
 * @desc    Place a bet on an event market
 */
exports.placeBet = async (req, res) => {
  try {
    const { eventId, marketId, stake } = req.body;
    const stakeNum = Number(stake);

    // Validate stake
    if (!stakeNum || stakeNum <= 0) {
      return response.error(res, 'Invalid stake', 400);
    }

    // Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return response.error(res, 'Event not found', 404);
    }

    const now = new Date();

    // ⏳ EVENT NOT STARTED
    if (
      event.startAt &&
      now < event.startAt &&
      event.status === 'scheduled'
    ) {
      return response.error(
        res,
        `Event has not started yet. Starts at ${event.startAt.toISOString()}`,
        400
      );
    }

    // ⛔ EVENT ENDED
    if (
      event.status === 'finished' ||
      event.status === 'cancelled' ||
      (event.endAt && now > event.endAt)
    ) {
      const endedAt = event.endAt
        ? `Event ended at ${event.endAt.toISOString()}`
        : 'Event has ended';

      return response.error(res, endedAt, 400);
    }

    // Find market inside event
    const market =
      event.markets.id(marketId) ||
      event.markets.find((m) => String(m._id) === String(marketId));

    if (!market) {
      return response.error(res, 'Market not found', 404);
    }

    // Check user balance
    if (req.user.balance < stakeNum) {
      return response.error(res, 'Insufficient balance', 400);
    }

    // Deduct stake and save user
    req.user.balance -= stakeNum;
    await req.user.save();

    // Calculate potential win
    const potentialWin = calculatePotentialWin(stakeNum, market.odds);

    // Create bet
    const bet = await Bet.create({
      user: req.user._id,
      event: event._id,
      market: {
        name: market.name,
        odds: market.odds,
      },
      stake: stakeNum,
      potentialWin,
      status: 'pending',
    });

    return response.success(res, bet, 'Bet placed successfully', 201);
  } catch (err) {
    console.error('❌ Error placing bet:', err);
    response.error(res, err.message || 'Unable to place bet', 500);
  }
};

/**
 * @route   GET /bets
 * @desc    List all bets
 */
exports.listBets = async (req, res) => {
  try {
    const bets = await Bet.find()
      .populate('user', 'username')
      .populate('event', 'title status startAt endAt');

    response.success(res, bets);
  } catch (err) {
    console.error('❌ Error listing bets:', err);
    response.error(res, 'Unable to fetch bets', 500);
  }
};

/**
 * @route   GET /bets/user
 * @desc    List bets for logged-in user
 */
exports.userBets = async (req, res) => {
  try {
    const bets = await Bet.find({ user: req.user._id })
      .populate('event', 'title status startAt endAt')
      .sort({ createdAt: -1 });

    response.success(res, bets);
  } catch (err) {
    console.error('❌ Error listing user bets:', err);
    response.error(res, 'Unable to fetch your bets', 500);
  }
};

/**
 * @route   GET /bets/:id/receipt
 * @desc    Get detailed receipt for a specific bet
 */
exports.betReceipt = async (req, res) => {
  try {
    const betId = req.params.id;

    const bet = await Bet.findById(betId)
      .populate('user', 'username email')
      .populate('event', 'title startAt endAt status')
      .lean();

    if (!bet) {
      return response.error(res, 'Bet not found', 404);
    }

    // Security: Ensure only owner can access
    if (String(bet.user._id) !== String(req.user._id)) {
      return response.error(res, 'Unauthorized to view this receipt', 403);
    }

    // Determine event state message
    let eventState = 'Live';

    const now = new Date();
    if (bet.event?.startAt && now < bet.event.startAt) {
      eventState = `Not started (starts at ${bet.event.startAt.toISOString()})`;
    } else if (
      bet.event?.status === 'finished' ||
      (bet.event?.endAt && now > bet.event.endAt)
    ) {
      eventState = bet.event.endAt
        ? `Ended at ${bet.event.endAt.toISOString()}`
        : 'Ended';
    }

    // Build receipt data
    const receipt = {
      receiptId: bet._id,
      user: bet.user.username,
      event: bet.event?.title || 'Event removed',
      eventStatus: eventState,
      market: bet.market?.name,
      odds: bet.market?.odds,
      stake: bet.stake,
      potentialWin: bet.potentialWin,
      status: bet.status,
      placedAt: bet.createdAt,
      updatedAt: bet.updatedAt,
    };

    return response.success(res, receipt, 'Bet receipt fetched');
  } catch (err) {
    console.error('❌ Error fetching receipt:', err);
    response.error(res, 'Unable to get bet receipt', 500);
  }
};
