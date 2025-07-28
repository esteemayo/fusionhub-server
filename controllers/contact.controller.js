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
    <table style="width:100%; max-width:600px; border-collapse:collapse; font-family:Arial,sans-serif;">
      <tr>
        <td style="background:#f5f5f5; padding:16px 24px; border-bottom:1px solid #ddd;">
          <h2 style="margin:0; color: rgba(75, 76, 77, 0.64);">New Contact Form Submission</h2>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="font-size:15px; color:rgba(68, 72, 75, 0.64); margin:0 0 12px 0;">
            <span font-weight:700;>Subject:</span> ${contact.subject}
          </p>
          <p style="font-size:15px; color:rgba(50, 53, 56, 0.64); margin:0 0 12px 0;">
            <span font-weight:700;>Written by:</span> ${contact.name}
          </p>
          <p style="font-size:15px; color:rgba(50, 53, 56, 0.64); margin:0 0 12px 0;">
            <span font-weight:700;>Email address:</span>
            <a href="mailto:${contact.email}" style="color:#1a73e8;">${contact.email}</a>
          </p>
          <p style="font-size:15px; color:rgba(50, 53, 56, 0.64); margin:0 0 12px 0;">
            <span font-weight:700;>Phone:</span>
            <a href="tel:${contact.phone}" style="color:#1a73e8;">${contact.phone}</a>
          </p>
          <hr style="border:none; border-top:1px solid #eee; margin:16px 0;">
          <p style="color:rgba(50, 53, 56, 0.64); margin:0;">
            <span font-weight:700;>Message:</span>
          </p>
          <div style="background:#fafafa; padding:16px; border-radius:4px; border:1px solid #eee; margin-top: 10px;">
            <span style="font-family:inherit; font-size:15px; color: #515151;">${contact.message}</span>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background:#f5f5f5; padding:12px 24px; text-align:center; font-size:12px; color:#888;">
          This email was generated from fusionHub contact form. © ${new Date().getFullYear()} fusionHub Contact Form
        </td>
      </tr>
    </table>
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
