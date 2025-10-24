import Ticket from '../models/Ticket.js';
import Loan from '../models/Loan.js';

/**
 * Create a new ticket for a loan application
 * @route POST /api/admin/tickets
 */
export const createTicket = async (req, res) => {
  try {
    const { loanId, subject, description, priority } = req.body;

    // Validate required fields
    if (!loanId || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide loanId and subject'
      });
    }

    // Check if loan exists
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    // Create new ticket
    const ticket = new Ticket({
      loanId,
      subject,
      description,
      priority: priority || 'Medium'
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error.message
    });
  }
};

/**
 * Get all tickets with optional filters
 * @route GET /api/admin/tickets
 */
export const getAllTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Execute query with pagination
    const tickets = await Ticket.find(query)
      .populate('loanId', 'fullName email phone loanType loanAmount')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const count = await Ticket.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
};

/**
 * Get a single ticket by ID
 * @route GET /api/admin/tickets/:id
 */
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('loanId')
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message
    });
  }
};

/**
 * Update ticket status
 * @route PATCH /api/admin/tickets/:id/status
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: error.message
    });
  }
};

/**
 * Assign ticket to a user
 * @route PATCH /api/admin/tickets/:id/assign
 */
export const assignTicket = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignedTo, updatedAt: Date.now() },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ticket',
      error: error.message
    });
  }
};

/**
 * Add a note to a ticket
 * @route POST /api/admin/tickets/:id/notes
 */
export const addTicketNote = async (req, res) => {
  try {
    const { text, addedBy } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Please provide note text'
      });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          notes: {
            text,
            addedBy: addedBy || req.user?.id,
            addedAt: Date.now()
          }
        },
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('notes.addedBy', 'name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
};

/**
 * Delete a ticket
 * @route DELETE /api/admin/tickets/:id
 */
export const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ticket',
      error: error.message
    });
  }
};
