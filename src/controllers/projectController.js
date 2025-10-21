import supabase from "../config/supabase.js";

// Get all project metadata for user (lightweight)
export const getProjectsMetadata = async (req, res) => {
  try {
    const { userId } = req.user;

    const { data: user, error } = await supabase
      .from('users')
      .select('projects_metadata')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch projects metadata'
      });
    }

    res.status(200).json({
      success: true,
      data: user.projects_metadata || []
    });
  } catch (error) {
    console.error('Get projects metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single project (full data)
export const getProject = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// backend/src/controllers/projectController.js
export const createProject = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id, name, template, resume, styles, createdAt, updatedAt } = req.body;

    console.log('Creating project for user:', userId);
    console.log('Project ID:', id);

    if (!id || !name || !template || !resume || !styles) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if project already exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .single();

    if (existingProject) {
      return res.status(409).json({
        success: false,
        message: 'Project with this ID already exists'
      });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{
        id,
        user_id: userId,
        name,
        template,
        resume,
        styles,
        created_at: createdAt || Date.now(),
        updated_at: updatedAt || Date.now()
      }])
      .select()
      .single();

    if (projectError) {
      console.error('Supabase project creation error:', projectError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create project in database',
        error: projectError.message
      });
    }

    console.log('Project created successfully:', project.id);

    // Update user's metadata
    const { data: user } = await supabase
      .from('users')
      .select('projects_metadata')
      .eq('id', userId)
      .single();

    const metadata = user?.projects_metadata || [];
    metadata.unshift({
      id: project.id,
      name: project.name,
      template: project.template,
      updatedAt: project.updated_at
    });

    await supabase
      .from('users')
      .update({ projects_metadata: metadata })
      .eq('id', userId);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// backend/src/controllers/projectController.js
export const updateProject = async (req, res) => {
  try {
    console.log('Update request received'); // Debug log
    console.log('User:', req.user); // Debug log
    console.log('Params:', req.params); // Debug log
    console.log('Body:', req.body); // Debug log
    
    const { userId } = req.user;
    const { id } = req.params;
    const { name, template, resume, styles } = req.body;

    if (!name || !template || !resume || !styles) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const updatedAt = Date.now();

    const { data: project, error: updateError } = await supabase
      .from('projects')
      .update({
        name,
        template,
        resume,
        styles,
        updated_at: updatedAt
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError || !project) {
      console.error('Supabase update error:', updateError); // Debug log
      return res.status(404).json({
        success: false,
        message: 'Project not found or update failed'
      });
    }

    // Update metadata
    const { data: user } = await supabase
      .from('users')
      .select('projects_metadata')
      .eq('id', userId)
      .single();

    const metadata = user.projects_metadata || [];
    const index = metadata.findIndex(p => p.id === id);

    if (index !== -1) {
      metadata[index] = {
        id: project.id,
        name: project.name,
        template: project.template,
        updatedAt: project.updated_at
      };

      await supabase
        .from('users')
        .update({ projects_metadata: metadata })
        .eq('id', userId);
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or delete failed'
      });
    }

    const { data: user } = await supabase
      .from('users')
      .select('projects_metadata')
      .eq('id', userId)
      .single();

    const metadata = (user.projects_metadata || []).filter(p => p.id !== id);

    await supabase
      .from('users')
      .update({ projects_metadata: metadata })
      .eq('id', userId);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
