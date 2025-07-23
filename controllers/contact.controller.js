import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Contact from '../models/contact.model.js';
import { CustomAPIError } from '../errors/cutom.api.error.js';

import { sendEmail } from '../utils/email.util.js';
import * as factory from './handler.factory.controller.js';

export const createContact = asyncHandler(async (req, res, next) => {
  const contact = await Contact.create({ ...req.body });

  const text = `
    Name: ${contact.name}\n
    Email:${contact.email}\n
    Phone:${contact.phone}\n
    Subject:${contact.subject}\n
    Message:${contact.message}
  `;

  const html = `
    <p>
      <strong>Name:</strong> ${contact.name}
    </p>
    <p>
      <strong>Email:</strong> ${contact.email}
    </p>
    <p>
      <strong>Phone:</strong> ${contact.phone}
    </p>
    <p>
      <strong>Subject:</strong> ${contact.subject}
    </p>
    <p>
      <strong>Message:</strong> ${contact.message}
    </p>
  `;

  try {
    await sendEmail({
      from: `Blog Contact <${contact.email}>`,
      subject: 'New Contact Form Submission',
      text,
      html,
    });

    return res.status(StatusCodes.CREATED).json({
      message: 'Message sent successfully',
      email: contact.email,
      success: true,
    });
  } catch (err) {
    next(new CustomAPIError('Server error. Pleasetry again later.'));
  }
});

export const getContacts = factory.getAll(Contact);
export const getContact = factory.getOneById(Contact);
export const updateContact = factory.updateOne(Contact);
export const deleteContact = factory.deleteOne(Contact);
